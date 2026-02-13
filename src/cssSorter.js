const vscode = require('vscode');

// --- 常量和正则表达式 ---
const REGEX_SCSS_COMMENT = /^\/\/.*$/;
const REGEX_CSS_BLOCK_COMMENT = /^\/\*.*\*\/$/;
const REGEX_CSS_COMMENT_START = /\/\*.*$/;
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
 * 解析提取属性块（属性和相关注释）
 * 插件核心函数
 * @param {string[]} selectedLines 选中的文本行数组
 * @param {string} eol 行结束符
 * @returns {Array<{ property: string, text: string, range: {start: number, end: number} }>} 属性块数组，每个块包含属性名、完整文本和行范围
 */
function getPropertyBlocks(selectedLines, eol = '\n') {
  const blocks = [];
  let i = 0;

  outerLoop: while (i < selectedLines.length) {
    const startLine = i;
    const currentBlockLines = [];

    // 1. 收集前置注释（单行和多行注释）
    while (i < selectedLines.length) {
      const line = selectedLines[i];
      if (isFullLineComment(line)) {
        // 单行注释
        currentBlockLines.push(line);
        i++;
      } else if (line.trim().startsWith('/*') && !line.trim().includes('*/')) {
        // 多行注释起始
        currentBlockLines.push(line);
        i++;
        // 继续收集直到注释结束
        while (i < selectedLines.length) {
          const nextLine = selectedLines[i];
          currentBlockLines.push(nextLine);
          i++;
          if (nextLine.includes('*/')) break;
        }
      } else {
        // 不是注释，跳出注释收集阶段
        break;
      }
    }

    // 2. 检查并处理属性
    const line = selectedLines[i];
    const propertyName = extractPropertyName(line);

    if (!propertyName) {
      // 非属性行，跳过（之前收集的注释会被丢弃）
      i++;
      continue;
    }

    // 发现有效属性，开始构建属性块
    let propertyClosed = false;
    let hasFollowingComment = false;

    // 收集完整的属性内容（可能跨多行，包含行内注释）
    while (i < selectedLines.length) {
      const currentLine = selectedLines[i];
      currentBlockLines.push(currentLine);
      i++;

      // 判断属性是否闭合（遇到结尾分号）
      const cleanLine = currentLine.replace(REGEX_REMOVE_COMMENTS, '').trim();
      if (cleanLine.endsWith(';')) {
        propertyClosed = true;
      } else if (cleanLine.endsWith('{') || cleanLine.endsWith('}')) {
        // 还没遇到分号就先遇到了大括号，存在歧义，忽略
        continue outerLoop; // 直接跳过当前属性块
      }

      // 检测是否有后接多行注释
      if (REGEX_CSS_COMMENT_START.test(currentLine)) {
        hasFollowingComment = true;
      } else if (hasFollowingComment && currentLine.includes('*/')) {
        hasFollowingComment = false;
      }

      // 属性语义结束时完成当前块
      if (propertyClosed) break;
    }

    // 3. 收集后接注释（单行和多行注释）
    if (hasFollowingComment) {
      while (i < selectedLines.length) {
        const nextLine = selectedLines[i];
        currentBlockLines.push(nextLine);
        i++;
        if (nextLine.trim().endsWith('*/')) break;
      }
    }

    // 添加完整的属性块
    blocks.push({
      property: propertyName,
      text: currentBlockLines.join(eol),
      range: { start: startLine, end: i - 1 },
    });
  }

  return blocks;
}

/**
 * 比较器生成函数
 * @param {string[]} customOrder 自定义顺序
 * @param {string} sortOrder 排序方式 'custom' | 'alphabetical'
 * @param {string} unknownPropertyPosition 未知属性位置 'top' | 'bottom'
 * @returns {function(object, object): number} 比较函数
 */
function getBlockComparator(
  customOrder,
  sortOrder = 'custom',
  unknownPropertyPosition = 'bottom',
) {
  return (a, b) => {
    if (sortOrder === 'alphabetical') {
      return a.property.localeCompare(b.property);
    }

    const indexA = customOrder.indexOf(a.property);
    const indexB = customOrder.indexOf(b.property);
    const isUnknownA = indexA === -1;
    const isUnknownB = indexB === -1;

    // 规则：
    // 都在自定义列表中：按列表顺序排序
    if (!isUnknownA && !isUnknownB) {
      return indexA - indexB;
    }

    // 都不在列表中：保留原始索引顺序（稳定）
    if (isUnknownA && isUnknownB) {
      return a.range.start - b.range.start;
    }

    // 一个在列表中，一个不在
    if (unknownPropertyPosition === 'top') {
      // 未知属性排在前面
      return isUnknownA ? -1 : 1;
    } else {
      // 默认：未知属性排在后面
      return isUnknownA ? 1 : -1;
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
  return sorted.map((block) => block.text).join(eol);
}

/**
 * 扫描文本，识别可排序的连续块，并直接返回排序后的结果
 * @param {string} text
 * @returns {Array<{start: number, end: number, sortedText: string}>}
 */
function scanAndSortCss(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(REGEX_NEWLINE);
  const blocks = getPropertyBlocks(lines, eol);
  const results = [];

  const config = vscode.workspace.getConfiguration('css-property-sorter');
  const customOrder = config.get('customOrder', []);
  const sortOrder = config.get('sortOrder', 'custom');
  const unknownPropertyPosition = config.get(
    'unknownPropertyPosition',
    'bottom',
  );
  const comparator = getBlockComparator(
    customOrder,
    sortOrder,
    unknownPropertyPosition,
  );

  let currentGroup = [];

  for (const block of blocks) {
    if (currentGroup.length > 0) {
      const prevBlock = currentGroup[currentGroup.length - 1];
      // 如果当前块与上一块之间有空隙（不连续），则结束当前组
      if (block.range.start > prevBlock.range.end + 1) {
        const sortedText = processGroup(currentGroup, comparator, eol);
        results.push({
          start: currentGroup[0].range.start,
          end: prevBlock.range.end,
          sortedText,
        });
        currentGroup = [];
      }
    }
    currentGroup.push(block);
  }

  // 处理最后遗留的组
  if (currentGroup.length > 0) {
    const sortedText = processGroup(currentGroup, comparator, eol);
    results.push({
      start: currentGroup[0].range.start,
      end: currentGroup[currentGroup.length - 1].range.end,
      sortedText,
    });
  }

  return results;
}

module.exports = {
  scanAndSortCss,
};
