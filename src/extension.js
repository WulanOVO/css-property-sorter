const vscode = require('vscode');
const { scanAndSortCss } = require('./cssSorter');

const messages = {
  en: {
    confirmSort: 'Are you sure you want to sort the selected CSS properties?',
    noCssProperties: '✘ No sortable CSS properties in selection',
    sortSuccess: '✔ CSS properties sorted successfully',
    noChanges: '✔ CSS properties sorted successfully (no changes)',
    replaceFailed: '✘ Failed to replace content',
    openFileFirst: '✘ Please open a file first',
  },
  'zh-cn': {
    confirmSort: '确定要对整个文件的 CSS 属性进行排序吗？',
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
 * 应用编辑并显示状态
 * @param {vscode.TextEditor} editor
 * @param {Array<{range: vscode.Range, text: string}>} edits
 */
function applyEdits(editor, edits) {
  if (edits.length === 0) {
    vscode.window.setStatusBarMessage(getMessage('noCssProperties'), 3000);
    return;
  }

  // 更新选区以高亮显示即将排序的块（视觉反馈）
  const newSelections = edits.map(
    (edit) => new vscode.Selection(edit.range.start, edit.range.end),
  );
  editor.selections = newSelections;

  let hasChanges = false;

  editor
    .edit((editBuilder) => {
      for (const edit of edits) {
        const currentText = editor.document.getText(edit.range);
        // 只有当内容发生变化时才替换，避免不必要的编辑
        if (currentText !== edit.text) {
          editBuilder.replace(edit.range, edit.text);
          hasChanges = true;
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
    'css-property-sorter.sortSelectedCssProperties',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.setStatusBarMessage(getMessage('openFileFirst'), 3000);
        return;
      }

      const edits = [];
      const originalSelections = editor.selections;

      for (const selection of originalSelections) {
        if (selection.isEmpty) continue;

        const fullSelection = expandSelectionToFullLines(editor, selection);
        const text = editor.document.getText(fullSelection);

        if (!text.trim()) continue;

        const results = scanAndSortCss(text);
        const startLine = fullSelection.start.line;

        for (const res of results) {
          const rangeStartLine = startLine + res.start;
          const rangeEndLine = startLine + res.end;

          const startPos = new vscode.Position(rangeStartLine, 0);
          const endPos = editor.document.lineAt(rangeEndLine).range.end;
          const range = new vscode.Range(startPos, endPos);

          edits.push({ range, text: res.sortedText });
        }
      }

      applyEdits(editor, edits);
    },
  );

  // 注册排序命令：全文排序
  let sortFileCmd = vscode.commands.registerCommand(
    'css-property-sorter.sortCssPropertiesInFile',
    async () => {
      // 提示确认
      const enableConfirm = vscode.workspace
        .getConfiguration('css-property-sorter')
        .get('enableConfirm');

      if (enableConfirm) {
        const confirm = await vscode.window.showWarningMessage(
          getMessage('confirmSort'),
          'Sort',
          'Cancel',
        );

        if (confirm !== 'Sort') {
          return;
        }
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.setStatusBarMessage(getMessage('openFileFirst'), 3000);
        return;
      }

      const text = editor.document.getText();
      const results = scanAndSortCss(text);
      const edits = [];

      for (const res of results) {
        const startPos = new vscode.Position(res.start, 0);
        const endPos = editor.document.lineAt(res.end).range.end;
        const range = new vscode.Range(startPos, endPos);
        edits.push({ range, text: res.sortedText });
      }

      applyEdits(editor, edits);
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
