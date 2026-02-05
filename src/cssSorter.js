const vscode = require('vscode');

// --- 常量和正则表达式 ---
const REGEX_SCSS_COMMENT = /^\/\/.*$/;
const REGEX_CSS_BLOCK_COMMENT = /^\/\*.*\*\/$/;
const REGEX_REMOVE_COMMENTS = /\/\*.*?\*\/|\/\/.*|\/\*.*$|.*\*\/$/g;
const REGEX_NEWLINE = /\r?\n/;

/**
 * 核心：判断是否为整行注释
 * @param {string} line 单行文本
 * @returns {boolean} 是否为整行注释
 */
function isFullLineComment(line) {
  const trimmedLine = line.trim();
  // 支持 SCSS // 注释 和 CSS /* */ 整行注释
  return (
    REGEX_SCSS_COMMENT.test(trimmedLine) ||
    REGEX_CSS_BLOCK_COMMENT.test(trimmedLine)
  );
}

/**
 * 提取CSS属性名（忽略值和注释）
 * @param {string} line 单行CSS属性行
 * @returns {string|null} 属性名（如 width）
 */
function extractPropertyName(line) {
  // 移除注释，获取纯代码内容
  const lineWithoutComments = line.replace(REGEX_REMOVE_COMMENTS, '').trim();

  // 1. 基本过滤：空行或无冒号
  if (!lineWithoutComments || !lineWithoutComments.includes(':')) return null;

  // 2. 结构性过滤：以 { 结尾通常是规则块开始
  if (lineWithoutComments.endsWith('{')) return null;

  // 3. 提取属性名部分
  const propertyPart = lineWithoutComments.split(':')[0].trim();

  // 4. 属性名合法性检查
  // 不允许包含 { } @
  if (/[{}@]/.test(propertyPart)) return null;

  // SCSS 嵌套选择器检查 (以 & 开头)
  if (propertyPart.startsWith('&')) return null;

  return propertyPart;
}

/**
 * 关联整行注释和下一行属性（注释随下一行移动）
 * 支持多行属性（按分号封闭）
 * @param {string[]} selectedLines 选中的文本行数组
 * @param {string} eol 行结束符
 * @returns {Array<{ comments: string[], property: string, line: string, originalIndex: number }>} 关联后的块数组
 */
function associateCommentProps(selectedLines, eol = '\n') {
  const blocks = [];
  let currentComments = [];
  let originalIndex = 0;

  for (let i = 0; i < selectedLines.length; i++) {
    const line = selectedLines[i];

    if (isFullLineComment(line)) {
      // 收集连续的整行注释
      currentComments.push(line);
    } else {
      const propertyName = extractPropertyName(line);
      if (propertyName) {
        // 属性开始
        let propertyLines = [line];
        let j = i;

        // 检查是否以分号结尾（忽略注释）
        const isSelfContained = (str) => {
          // 移除末尾注释
          const t = str.replace(REGEX_REMOVE_COMMENTS, '').trim();
          return t.endsWith(';');
        };

        // 如果不是完整行，尝试向后合并
        // 注意：这里我们假设用户代码格式基本正确，属性以分号结尾
        // 如果找不到分号，会一直合并到末尾
        while (
          !isSelfContained(propertyLines[propertyLines.length - 1]) &&
          j + 1 < selectedLines.length
        ) {
          j++;
          propertyLines.push(selectedLines[j]);
        }

        // 更新主循环索引
        i = j;

        // 关联注释和当前属性块
        blocks.push({
          comments: [...currentComments],
          property: propertyName,
          line: propertyLines.join(eol),
          originalIndex: originalIndex, // 保留原始索引
        });
        // 重置注释收集器
        currentComments = [];
      } else {
        // 非属性行、非整行注释（如空行、选择器），单独作为块（不参与排序）
        if (currentComments.length > 0) {
          // 无后续属性的注释，单独作为块
          blocks.push({
            comments: [...currentComments],
            property: null,
            line: '',
            originalIndex: originalIndex,
          });
          currentComments = [];
        }
        blocks.push({
          comments: [],
          property: null,
          line: line,
          originalIndex: originalIndex,
        });
      }
    }
    originalIndex++;
  }

  // 处理末尾剩余的注释
  if (currentComments.length > 0) {
    blocks.push({
      comments: currentComments,
      property: null,
      line: '',
      originalIndex: originalIndex,
    });
  }

  return blocks;
}

/**
 * 核心排序逻辑（保持显示效果、保留重复属性顺序）
 * @param {string} selectedText 选中的文本
 * @returns {string} 排序后的文本
 */
function sortCssProperties(selectedText) {
  // 1. 获取自定义属性顺序（从VSCode配置中读取）
  const customOrder = vscode.workspace
    .getConfiguration('cssPropertySorter')
    .get('customOrder', []);

  // 检测 EOL
  const eol = selectedText.includes('\r\n') ? '\r\n' : '\n';

  // 2. 分割为行数组，保留换行符格式
  const selectedLines = selectedText.split(REGEX_NEWLINE);
  if (selectedLines.length === 0) return selectedText;

  // 3. 关联注释和属性，生成块数组
  const blocks = associateCommentProps(selectedLines, eol);

  // 4. 分离可排序块（有属性）
  const sortableBlocks = blocks.filter((block) => block.property !== null);

  // 5. 无可用排序块，直接返回原文本
  if (sortableBlocks.length === 0) return selectedText;

  // 6. 稳定排序：按自定义顺序排序，未在列表中的放末尾，重复属性保留原始顺序
  const sortedSortableBlocks = [...sortableBlocks].sort((a, b) => {
    const indexA = customOrder.indexOf(a.property);
    const indexB = customOrder.indexOf(b.property);

    // 规则：
    // 1. 都在自定义列表中：按列表顺序排序
    // 2. 只有一个在列表中：在列表中的排前面
    // 3. 都不在列表中：保留原始索引顺序（稳定）
    // 4. 同一属性（重复）：保留原始索引顺序（稳定，保证显示效果不变）
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    } else if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    } else {
      return a.originalIndex - b.originalIndex;
    }
  });

  // 7. 重组块数组（保留原始结构，只替换属性块的内容）
  const resultLines = [];
  let sortableIndex = 0;

  for (const block of blocks) {
    let targetBlock;
    if (block.property !== null) {
      // 如果是属性块，使用排序后的属性块
      targetBlock = sortedSortableBlocks[sortableIndex++];
    } else {
      // 如果是非属性块（空行、注释等），保持原样
      targetBlock = block;
    }

    // 拼接注释行
    resultLines.push(...targetBlock.comments);
    // 拼接属性行（允许空行）
    if (targetBlock.line !== undefined) resultLines.push(targetBlock.line);
  }

  // 8. 重组为文本（拼接注释和属性行）
  const finalResult = resultLines.join(eol);

  // 9. 验证：如果排序后和原文本一致（无可排序内容或顺序未变），返回原文本
  return finalResult === selectedText ? selectedText : finalResult;
}

/**
 * 识别连续的属性块范围
 * @param {string} text 选中的文本
 * @returns {Array<{start: number, end: number}>} 连续属性块的行号范围（从0开始）
 */
function getSortableRanges(text) {
  const lines = text.split(REGEX_NEWLINE);
  const blocks = associateCommentProps(lines);
  const ranges = [];

  let currentStart = -1;
  let currentLineIndex = 0;

  for (const block of blocks) {
    // 计算该块占用的行数（注释行 + 属性行）
    // block.line 是通过 join 生成的，所以用 split 计算行数
    let lineContentCount = 0;
    if (block.line !== '') {
      lineContentCount = block.line.split(REGEX_NEWLINE).length;
    } else if (block.comments.length === 0) {
      // 空行（无注释的空行块），在原文本中占一行
      lineContentCount = 1;
    }
    // else: line为空且有注释，说明是纯注释块（orphaned comments），line字段不对应原文本行，仅占注释行数

    const blockLineCount = block.comments.length + lineContentCount;

    if (block.property !== null) {
      if (currentStart === -1) {
        currentStart = currentLineIndex;
      }
    } else {
      // 遇到非属性块（如空行、结构性字符等），结束当前连续块
      if (currentStart !== -1) {
        ranges.push({ start: currentStart, end: currentLineIndex - 1 });
        currentStart = -1;
      }
    }

    currentLineIndex += blockLineCount;
  }

  // 处理最后遗留的块
  if (currentStart !== -1) {
    ranges.push({ start: currentStart, end: currentLineIndex - 1 });
  }

  return ranges;
}

module.exports = {
  sortCssProperties,
  getSortableRanges,
};
