# *(Better)* CSS Property Sorter

[English](#english) | [中文](#中文)

---

## English

**CSS Property Sorter** is a Visual Studio Code extension that automatically sorts CSS/SCSS properties in a custom order, helping you keep your code clean, consistent and easy to read.

### ✨ Features

- **Custom Sort Order**: Support sorting based on predefined orders or your own custom order.
- **Intelligent Sorting**:
  - Automatically identifies CSS property blocks.
  - Correctly handles complex **nested properties** in SCSS.
  - Supports **selection sorting** and **full-file sorting**.
  - **Comment Preservation**: Intelligently processes and preserves single-line comments (`//`) and block comments (`/* */`), ensuring they remain associated with their corresponding properties.
  - Properly handles **multi-line properties** to maintain code readability.
- **Safe & Reliable**: Only adjusts the order of properties within rules without modifying property values or code structure.
- **Multi-Language Support**: Works with CSS and SCSS files.

### 🚀 Usage

You can use this extension in the following ways:

**Sort Selected CSS Properties:**

1. **Right-Click Menu**: Select the CSS code to sort, right-click, and choose **"Sort Selected CSS Properties"**.
2. **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac), type `Sort Selected CSS Properties` and select the corresponding command.
3. **Keyboard Shortcuts**:
   - Windows/Linux: `Shift+Alt+S`
   - Mac: `Shift+Option+S`

**Sort CSS Properties in Entire File:**

1. **Right-Click Menu**: Right-click and select **"Sort CSS Properties in File"**.
2. **Command Palette**: Similarly, select the `Sort CSS Properties in File` command.
3. **Keyboard Shortcuts**: No default shortcut is set; you can customize it in the VS Code settings.

    **Note**: A confirmation prompt will appear when sorting the entire file. If the prompt does not show up, try disabling the **Do Not Disturb** mode in the bottom-right corner of the status bar, or turn off the prompt in the settings.

### 📋 Available Commands

- `Sort Selected CSS Properties`: Sorts only the currently selected code block.
- `Sort CSS Properties in File`: Scans the current file and automatically identifies and sorts all CSS rule blocks.

### ⚙️ Configuration

You can customize the plugin settings in the VS Code settings (`settings.json`).

- **`css-property-sorter.customOrder`**: An array of strings that defines the priority of CSS property sorting. Properties not listed will be placed at the end.

**Default Sort Order (Partial Example)**:

```json
[
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "display",
  "visibility",
  ...
]
```

- **`css-property-sorter.sortOrder`**: Sort order method. Options: `"custom"` (default, uses the defined list), `"alphabetical"` (sorts by property name).
- **`css-property-sorter.unknownPropertyPosition`**: Where to place properties not in the custom order list (only applies when `sortOrder` is `"custom"`). Options: `"bottom"` (default), `"top"`.

- **`css-property-sorter.enableConfirm`**: Whether to send a confirmation prompt when sorting the entire file. Default value is `true`.

### ⚠️ Notes

- **Backup Your Code**: Please make sure to back up your code before using this extension to prevent unexpected issues.
- **Avoid Non-Standard CSS Syntax**: Do not omit the semicolon at the end of the last property in a block. While this does not affect code execution, it can cause parsing ambiguities (confused with multi-line properties) and the extension will exclude such properties from sorting.

### 📦 Installation

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for `Better CSS Property Sorter`.
4. Click **Install**.

*(This extension is named "Better CSS Property Sorter" in the Marketplace to distinguish it from the homonymous extension by Enzo Mourany. The original extension has been unmaintained for a long time and contains numerous issues, which led to the development of this one. The original name "CSS Property Sorter" is retained internally.)*

---

## 中文

**CSS Property Sorter (CSS 属性排序器)** 是一个 Visual Studio Code 扩展，它可以按照自定义顺序自动排序 CSS/SCSS 属性，帮助您保持代码整洁、一致且易于阅读。

### ✨ 功能特性

- **自定义排序顺序**：支持基于预定义顺序或您自定义的顺序进行排序。
- **智能排序**：
  - 自动识别 CSS 属性块。
  - 能正确处理 SCSS 复杂的**嵌套属性**。
  - 支持**选区排序**和**全文排序**。
  - **保留注释**：智能处理并保留单行注释 (`//`) 和块注释 (`/* */`)，确保它们与对应的属性保持关联。
  - 能够正确处理**跨越多行的属性**，保持代码的可读性。
- **安全可靠**：仅调整规则内的属性顺序，不修改属性值或代码结构。
- **多语言支持**：支持 CSS 和 SCSS 文件。

### 🚀 使用方法

您可以通过以下多种方式使用本扩展：

**排序选中的 CSS 属性：**

1. **右键菜单**：选中需要排序的 CSS 代码，点击鼠标右键，选择 **"排序选中的 CSS 属性 (Sort Selected CSS Properties)"**。
2. **命令面板**：按下 `Ctrl+Shift+P` (Mac 为 `Cmd+Shift+P`)，输入 `Sort Selected CSS Properties` 并选择相应命令。
3. **快捷键**：
   - Windows/Linux: `Shift+Alt+S`
   - Mac: `Shift+Option+S`

**排序全文 CSS 属性：**

1. **右键菜单**：右键选择 **"排序全文 CSS 属性 (Sort CSS Properties in File)"**。
2. **命令面板**：同理，选择 `Sort CSS Properties in File` 命令。
3. **快捷键**：无默认快捷键，您可以在 VS Code 设置中自定义。

    **注意**：排序全文 CSS 属性时，会发送提示确认，如果没有收到提示可以尝试在状态栏右下角关闭“请勿打扰”模式，或在设置中禁用该提示。

### 📋 可用命令

- `Sort Selected CSS Properties` (排序选中区域 CSS 属性)：仅对当前选中的代码块进行排序。
- `Sort CSS Properties in File` (全文 CSS 属性排序)：扫描当前文件，自动识别并排序所有 CSS 规则块。

### ⚙️ 配置设置

您可以在 VS Code 设置 (`settings.json`) 中自定义插件设置。

- **`css-property-sorter.customOrder`**: 定义 CSS 属性排序优先级的字符串数组。未在列表中出现的属性将被放置在最后。

**默认排序示例 (部分)**：

```json
[
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "display",
  "visibility",
  ...
]
```

- **`css-property-sorter.sortOrder`**: 排序方式。选项：`"custom"`（默认，使用自定义列表），`"alphabetical"`（按属性名首字母排序）。
- **`css-property-sorter.unknownPropertyPosition`**: 未知属性（不在自定义列表中）的放置位置（仅当 `sortOrder` 为 `"custom"` 时有效）。选项：`"bottom"`（默认，放在底部），`"top"`（放在顶部）。

- **`css-property-sorter.enableConfirm`**: 是否在排序全文 CSS 属性时发送确认提示。默认值为 `true`。

### ⚠️ 注意事项

- **备份您的代码**：在使用本插件前，请确保备份您的代码，以防意外发生。
- **避免非规范 CSS 写法**：请勿在块的最后一行省略属性的分号，虽然这不会影响代码的运行，但会导致解析出现歧义（与多行属性混淆），本插件会将其排除在排序范围之外。

### 📦 安装

1. 打开 **Visual Studio Code**。
2. 进入 **扩展 (Extensions)** 视图 (`Ctrl+Shift+X` 或 `Cmd+Shift+X`)。
3. 搜索 `Better CSS Property Sorter`。
4. 点击 **安装 (Install)**。

*（本插件商店名称为 "Better CSS Property Sorter"，为了与 Enzo Mourany 的同名插件区分。由于原插件长期未维护且存在诸多问题，故开发本插件，内部保留 "CSS Property Sorter" 的原始命名）*