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
  // 移除注释
  const lineWithoutComments = line.replace(REGEX_REMOVE_COMMENTS, '').trim();
  // 过滤非属性行
  if (!lineWithoutComments || !lineWithoutComments.includes(':')) return null;
  if (lineWithoutComments.startsWith('@')) return null;
  if (lineWithoutComments.endsWith('{')) return null;

  // 提取属性名部分
  const propertyPart = lineWithoutComments.split(':')[0].trim();
  // 属性名合法性检查（不允许包含 { } @）
  if (/[{}@]/.test(propertyPart)) return null;

  return propertyPart;
}

/**
 * 关联整行注释和下一行属性（注释随下一行移动）
 * 支持多行属性（按分号封闭）
 * @param {string[]} selectedLines 选中的文本行数组
 * @param {string} eol 行结束符
 * @returns {Array<{ property: string|null, line: string, originalIndex: number }>} 关联后的块数组
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
    } else if (line.trim().startsWith('/*') && !line.trim().includes('*/')) {
      // 处理多行注释起始（非单行闭合）
      currentComments.push(line);
      let j = i + 1;
      while (j < selectedLines.length) {
        const nextLine = selectedLines[j];
        currentComments.push(nextLine);
        if (nextLine.includes('*/')) {
          i = j;
          break;
        }
        j++;
      }
      if (j === selectedLines.length) i = j - 1;
    } else {
      const propertyName = extractPropertyName(line);
      if (propertyName) {
        // 属性开始
        let propertyLines = [line];
        let j = i;

        // 如果不是完整行，尝试向后合并，直到遇到包含 ; 或 { 的行
        let isValidProperty = true;
        while (true) {
          // 移除注释
          const t = propertyLines[propertyLines.length - 1]
            .replace(REGEX_REMOVE_COMMENTS, '')
            .trim();

          if (t.endsWith(';')) { // 完整属性行
            isValidProperty = true;
            break;
          } else if (t.endsWith('{')) { // 多行选择器，非属性
            isValidProperty = false;
            break;
          } else if (j >= selectedLines.length - 1) { // 到达文本末尾
            isValidProperty = false;
            break;
          }

          j++;
          const currentLine = selectedLines[j];
          propertyLines.push(currentLine);
        }

        i = j;

        // 合并注释和属性行
        const fullBlockContent = [...currentComments, propertyLines.join(eol)].join(eol);

        // 关联注释和当前属性块
        blocks.push({
          property: isValidProperty ? propertyName : null,
          line: fullBlockContent,
          originalIndex: originalIndex, // 保留原始索引
        });
        // 重置注释收集器
        currentComments = [];
      } else {
        // 非属性行、非整行注释（如空行、选择器），单独作为块（不参与排序）
        if (currentComments.length > 0) {
          // 无后续属性的注释，单独作为块
          blocks.push({
            property: null,
            line: currentComments.join(eol),
            originalIndex: originalIndex,
          });
          currentComments = [];
        }
        blocks.push({
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
      property: null,
      line: currentComments.join(eol),
      originalIndex: originalIndex,
    });
  }

  return blocks;
}

/**
 * 比较器生成函数
 * @param {string[]} customOrder 自定义顺序
 * @returns {function(object, object): number} 比较函数
 */
function getBlockComparator(customOrder) {
  return (a, b) => {
    const indexA = customOrder.indexOf(a.property);
    const indexB = customOrder.indexOf(b.property);

    // 规则：
    // 都在自定义列表中：按列表顺序排序
    // 只有一个在列表中：在列表中的排前面
    // 都不在列表中：保留原始索引顺序（稳定）
    // 同一属性（重复）：保留原始索引顺序（稳定，保证显示效果不变）
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    } else if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    } else {
      return a.originalIndex - b.originalIndex;
    }
  };
}

/**
 * 对一组属性块进行排序并拼接为文本
 * @param {Array} groupBlocks
 * @param {Function} comparator
 * @param {string} eol
 * @returns {string}
 */
function processGroup(groupBlocks, comparator, eol) {
  const sorted = [...groupBlocks].sort(comparator);
  return sorted.map((block) => block.line).join(eol);
}

/**
 * 扫描文本，识别可排序的连续块，并直接返回排序后的结果
 * @param {string} text
 * @returns {Array<{start: number, end: number, sortedText: string}>}
 */
function scanAndSortCss(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(REGEX_NEWLINE);
  const blocks = associateCommentProps(lines, eol);
  const results = [];

  const customOrder = vscode.workspace
    .getConfiguration('cssPropertySorter')
    .get('customOrder', []);
  const comparator = getBlockComparator(customOrder);

  let currentGroup = [];
  let currentStartLine = -1;
  let currentLineIndex = 0;

  for (const block of blocks) {
    // 计算该块占用的行数
    const blockLineCount = block.line.split(REGEX_NEWLINE).length;

    if (block.property !== null) {
      if (currentStartLine === -1) {
        currentStartLine = currentLineIndex;
      }
      currentGroup.push(block);
    } else {
      // 遇到非属性块，结束当前连续块
      if (currentGroup.length > 0) {
        const sortedText = processGroup(currentGroup, comparator, eol);
        results.push({
          start: currentStartLine,
          end: currentLineIndex - 1,
          sortedText,
        });
        currentGroup = [];
        currentStartLine = -1;
      }
    }
    currentLineIndex += blockLineCount;
  }

  // 处理最后遗留的块
  if (currentGroup.length > 0) {
    const sortedText = processGroup(currentGroup, comparator, eol);
    results.push({
      start: currentStartLine,
      end: currentLineIndex - 1,
      sortedText,
    });
  }

  return results;
}

module.exports = {
  scanAndSortCss,
};
