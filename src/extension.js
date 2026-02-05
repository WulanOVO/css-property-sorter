const vscode = require('vscode');
const { sortCssProperties, getSortableRanges } = require('./cssSorter');

const messages = {
  en: {
    noCssProperties: '✘ No sortable CSS properties in selection',
    sortSuccess: '✔ CSS properties sorted successfully',
    noChanges: '✔ CSS properties sorted successfully (no changes)',
    replaceFailed: '✘ Failed to replace content',
    openFileFirst: '✘ Please open a file first',
  },
  'zh-cn': {
    noCssProperties: '✘ 选区中没有可处理的 CSS 属性',
    sortSuccess: '✔ CSS 属性排序成功',
    noChanges: '✔ CSS 属性排序成功（无变化）',
    replaceFailed: '✘ 替换内容失败',
    openFileFirst: '✘ 请先打开一个文件',
  },
};

/**
 * 获取本地化的消息
 * @param {string} key - 消息键
 * @returns {string} 本地化的消息
 */
function getMessage(key) {
  const lang = vscode.env.language.toLowerCase();
  const locale = lang.startsWith('zh') ? 'zh-cn' : 'en';
  return messages[locale][key] || messages['en'][key];
}

/**
 * 自动扩展选择范围至整行
 * @param {vscode.TextEditor} editor
 * @param {vscode.Selection} selection
 * @returns {vscode.Selection} 扩展后的选择范围
 */
function expandSelectionToFullLines(editor, selection) {
  if (selection.isEmpty) {
    return selection;
  }

  const startLine = selection.start.line;
  let endLine = selection.end.line;

  // 如果结束位置在行首，且不是同一行，则不包含该行（符合通常的选择逻辑）
  if (selection.end.character === 0 && endLine > startLine) {
    endLine--;
  }

  const startPos = new vscode.Position(startLine, 0);
  const endPos = editor.document.lineAt(endLine).range.end;
  return new vscode.Selection(startPos, endPos);
}

/**
 * 执行排序并替换
 * @param {vscode.TextEditor} editor
 * @param {vscode.Selection[]} selections
 */
function performSort(editor, selections) {
  if (selections.length === 0) {
    vscode.window.setStatusBarMessage(getMessage('noCssProperties'), 3000);
    return;
  }

  // 更新选区以高亮显示即将排序的块（视觉反馈）
  editor.selections = selections;

  let hasChanges = false;

  editor
    .edit((editBuilder) => {
      for (const selection of selections) {
        const text = editor.document.getText(selection);
        try {
          const sortedText = sortCssProperties(text);
          // 只有当内容发生变化时才替换，避免不必要的编辑
          if (sortedText !== text) {
            editBuilder.replace(selection, sortedText);
            hasChanges = true;
          }
        } catch (error) {
          console.error('[css-property-sorter] Error:', error);
        }
      }
    })
    .then((success) => {
      if (success) {
        if (hasChanges) {
          vscode.window.setStatusBarMessage(getMessage('sortSuccess'), 3000);
        } else {
          vscode.window.setStatusBarMessage(getMessage('noChanges'), 3000);
        }
      } else {
        vscode.window.setStatusBarMessage(getMessage('replaceFailed'), 3000);
      }
    });
}

function activate(context) {
  // 注册排序命令：选区排序
  let sortSelectionCmd = vscode.commands.registerCommand(
    'css-property-sorter.sortCssProperties',
    function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.setStatusBarMessage(getMessage('openFileFirst'), 3000);
        return;
      }

      const newSelections = [];
      const originalSelections = editor.selections;

      for (const selection of originalSelections) {
        if (selection.isEmpty) continue;

        const fullSelection = expandSelectionToFullLines(editor, selection);
        const text = editor.document.getText(fullSelection);

        if (!text.trim()) continue;

        const ranges = getSortableRanges(text);
        const startLine = fullSelection.start.line;
        for (const range of ranges) {
          const rangeStartLine = startLine + range.start;
          const rangeEndLine = startLine + range.end;

          const startPos = new vscode.Position(rangeStartLine, 0);
          const endPos = editor.document.lineAt(rangeEndLine).range.end;
          newSelections.push(new vscode.Selection(startPos, endPos));
        }
      }

      performSort(editor, newSelections);
    },
  );

  // 注册排序命令：全文排序
  let sortFileCmd = vscode.commands.registerCommand(
    'css-property-sorter.sortCssPropertiesInFile',
    function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.setStatusBarMessage(getMessage('openFileFirst'), 3000);
        return;
      }

      const text = editor.document.getText();
      const ranges = getSortableRanges(text);
      const newSelections = [];

      for (const range of ranges) {
        const startPos = new vscode.Position(range.start, 0);
        const endPos = editor.document.lineAt(range.end).range.end;
        newSelections.push(new vscode.Selection(startPos, endPos));
      }

      performSort(editor, newSelections);
    },
  );

  context.subscriptions.push(sortSelectionCmd);
  context.subscriptions.push(sortFileCmd);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
