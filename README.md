# CSS Property Sorter (CSS 属性排序器)

[English](#english) | [中文](#中文)

---

## English

**CSS Property Sorter** is a Visual Studio Code extension that helps you keep your CSS/SCSS code organized by sorting properties according to a customizable order. It ensures that your styles are consistent and easy to read.

### ✨ Features

- **Customizable Sort Order**: Sorts CSS properties based on a predefined order or your own custom order.
- **Smart Sorting**:
  - Automatically identifies CSS property blocks.
  - Supports **Selection Sort** and **Full File Sort**.
  - **Preserves Comments**: Keeps single-line (`//`) and block (`/* */`) comments associated with their respective properties.
  - Handles **multi-line properties** correctly, maintaining readability.
- **Safe & Reliable**: Only affects the order of properties within rules; does not change values or structure.
- **Language Support**: Works with CSS and SCSS files.

### 🚀 Usage

You can use the extension in three ways:

1. **Context Menu**: Select the CSS code you want to sort, right-click, and choose **"Sort CSS Properties"**.
2. **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac), type `Sort CSS Properties`, and select the command.
3. **Keyboard Shortcut**:
   - Windows/Linux: `Shift+Alt+S`
   - Mac: `Shift+Option+S`

**Commands:**

- `Sort CSS Properties`: Sorts the properties within the current selection.
- `Sort CSS Properties in File`: Scans the entire file and sorts properties in all detected CSS rules.

### ⚙️ Configuration

You can customize the sorting order in your VS Code settings (`settings.json`).

* **`cssPropertySorter.customOrder`**: An array of CSS property names defining the sort order. Properties not listed will be placed at the end.

**Default Order (Partial):**

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

### 📦 Installation

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for `CSS Property Sorter`.
4. Click **Install**.

---

## 中文

**CSS Property Sorter (CSS 属性排序器)** 是一个 Visual Studio Code 扩展，它可以按照自定义顺序自动排序 CSS/SCSS 属性，帮助您保持代码整洁、一致且易于阅读。

### ✨ 功能特性

- **自定义排序顺序**：支持基于预定义顺序或您自定义的顺序进行排序。
- **智能排序**：
  - 自动识别 CSS 属性块。
  - 支持**选区排序**和**全文排序**。
  - **保留注释**：智能处理并保留单行注释 (`//`) 和块注释 (`/* */`)，确保它们与对应的属性保持关联。
  - 能够正确处理**跨越多行的属性**，保持代码的可读性。
- **安全可靠**：仅调整规则内的属性顺序，不修改属性值或代码结构。
- **多语言支持**：支持 CSS 和 SCSS 文件。

### 🚀 使用方法

您可以通过以下三种方式使用本扩展：

1. **右键菜单**：选中需要排序的 CSS 代码，点击鼠标右键，选择 **"CSS 属性排序 (Sort CSS Properties)"**。
2. **命令面板**：按下 `Ctrl+Shift+P` (Mac 为 `Cmd+Shift+P`)，输入 `Sort CSS Properties` 并选择相应命令。
3. **快捷键**：
   - Windows/Linux: `Shift+Alt+S`
   - Mac: `Shift+Option+S`

**可用命令：**

- `Sort CSS Properties` (排序选中区域 CSS 属性)：仅对当前选中的代码块进行排序。
- `Sort CSS Properties in File` (全文件 CSS 属性排序)：扫描当前文件，自动识别并排序所有 CSS 规则块。

### ⚙️ 配置设置

您可以在 VS Code 设置 (`settings.json`) 中自定义排序规则。

* **`cssPropertySorter.customOrder`**: 定义 CSS 属性排序优先级的字符串数组。未在列表中出现的属性将被放置在最后。

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

### 📦 安装

1. 打开 **Visual Studio Code**。
2. 进入 **扩展 (Extensions)** 视图 (`Ctrl+Shift+X` 或 `Cmd+Shift+X`)。
3. 搜索 `CSS Property Sorter`。
4. 点击 **安装 (Install)**。
