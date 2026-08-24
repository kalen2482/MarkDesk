# Changelog

All notable changes to MarkDesk are documented here.

## [0.2.7] - 2026-08-24

### 中文

#### 新增与改进

- 新增“上次模式”启动选项，可在下次启动时恢复关闭前使用的源码、分栏或可视化模式。
- 未保存的新文档支持双击标签或按 F2 重命名，并自动补充 Markdown 文件扩展名。
- 源码编辑器默认开启长行自动换行。

#### 修复

- 修复新建空白标签后，可视化区域仍显示上一份文档内容的问题。
- 修复新文档首次保存后标签仍显示“未命名.md”，且后续保存会重复弹出保存位置窗口的问题。
- 修复可视化编辑中设置的文字颜色和背景颜色在保存、关闭并重新打开后丢失的问题，并兼容旧版生成的 `<font color>` 格式。
- 修复输入一个或两个短横线时，上一行正文被临时解析为二级标题的问题。
- 修复源码编辑器行号与正文因字体和字号不同而逐行错位的问题。
- 修复 Windows 任务栏显示 Electron 默认图标的问题，并确保运行时和安装后的程序使用 MarkDesk 图标。

### English

#### Added and improved

- Added a “Last used” startup option that restores the Source, Split, or Visual view used before MarkDesk was closed.
- Unsaved documents can now be renamed by double-clicking their tab or pressing F2, with a Markdown extension added automatically.
- Long-line wrapping is now enabled by default in the source editor.

#### Fixed

- Fixed a newly created blank tab retaining the previous document in the visual editor.
- Fixed newly saved documents continuing to show “Untitled.md” and prompting for a save location again on every save.
- Fixed text and background colors applied in visual editing being lost after saving and reopening, including compatibility with legacy `<font color>` markup.
- Fixed typing one or two hyphens temporarily turning the preceding paragraph into a level-two heading.
- Fixed progressive misalignment between source-editor line numbers and text caused by different font metrics.
- Fixed the Windows taskbar showing the default Electron icon, and ensured packaged and running builds use the MarkDesk icon.

## [0.2.6] - 2026-08-18

### 中文

#### 修复与改进

- 修复通过“新建文件”或标签栏“+”创建 Markdown 标签后，应用又自动跳回先前文件、导致新标签无法持续选中和编辑的问题。
- 新建标签、选择标签、打开文件及恢复备份时会立即取消尚未完成的启动文件恢复，避免延迟任务抢占当前活动标签。
- 修正切换标签后的撤销与重做状态，使工具栏状态与当前文档保持一致。
- 新增标签会话恢复测试，覆盖有内容的新标签、空白新标签和应用启动场景。
- 修复部分应用复制 Markdown 时以 `{ "text": "..." }` 形式封装内容，导致 `\\n` 被当作普通文字显示、可视化预览无法正确换行的问题。源码区和可视化区现在会一致地解包这类多行文本剪贴板内容；常规 JSON 文档仍保持原样。
- 修复退出保存提示点击“取消”后，后续关闭请求不再响应、程序无法正常关闭的问题。

### English

#### Fixed and improved

- Fixed an issue where creating a Markdown tab from New File or the tab-bar plus button could immediately switch back to the previously active file, preventing the new tab from staying selected and editable.
- Creating or selecting a tab, opening a file, and restoring a backup now cancel any pending startup file restoration so delayed work cannot steal focus from the active tab.
- Corrected undo and redo state updates after switching tabs so the toolbar always reflects the active document.
- Added tab-session restoration tests covering populated new tabs, blank new tabs, and normal app startup.
- Fixed multiline Markdown clipboard content wrapped as `{ "text": "..." }` by some applications being pasted literally, leaving `\\n` visible and preventing correct visual rendering. Source and visual editors now unwrap this narrow clipboard envelope consistently while regular JSON documents remain unchanged.
- Fixed the application no longer responding to close requests after Cancel was clicked in the unsaved-changes dialog.

## [0.2.5] - 2026-08-13

### 中文

#### 新增与改进

- 优化响应式工具栏：源码、分栏和可视化模式切换始终可见；空间不足时，低频工具会自动收纳到“更多”菜单。
- “更多”、插入及标题菜单支持方向键、Home、End 和 Esc 键操作，并在关闭后恢复键盘焦点。
- 工具栏、菜单及提示文字会随界面语言即时切换，无需重新启动应用。
- Mermaid 图表和代码高亮改为按需加载；长文档的目录、统计和预览计算采用延迟更新，改善启动、输入与滚动响应。

#### 修复

- 修复在可视化编辑区粘贴 Markdown 后，标题、列表、表格等内容被转义或错误解析的问题。
- 修复粘贴内容后切换源码、分栏或可视化模式时，预览区域可能变为空白的问题。
- 修复窄窗口中工具栏按钮被截断、模式切换入口被收起的问题。
- 修复工具被收纳到“更多”菜单后点击无效，以及表情选择器无法打开的问题。
- 修复可视化编辑和预览模式中有序列表编号及无序列表标记消失的问题。
- 删除“关于 MarkDesk”窗口中的作者邮箱地址。

### English

#### Added and improved

- Improved the responsive toolbar: Source, Split, and Visual mode controls remain visible, while lower-priority tools move into the More menu when space is limited.
- Added Arrow, Home, End, and Escape keyboard navigation to the More, Insert, and heading menus, including focus restoration when a menu closes.
- Toolbar labels, menus, and tooltips now update immediately when the interface language changes; restarting the app is no longer required.
- Mermaid diagrams and syntax highlighting now load on demand, while outline, statistics, and preview work is deferred for better responsiveness in long documents.

#### Fixed

- Fixed Markdown pasted into the visual editor being escaped or parsed incorrectly, including headings, lists, and tables.
- Fixed the preview becoming blank after pasted content was followed by switching between Source, Split, and Visual modes.
- Fixed toolbar controls being clipped and view-mode controls disappearing in narrow windows.
- Fixed actions becoming unresponsive after moving into the More menu, including the emoji picker failing to open.
- Restored ordered-list numbers and unordered-list markers in visual editing and preview modes.
- Removed the author email address from the About MarkDesk dialog.

## [0.2.0] - 2026-08-03

### Added

- Interface language selector: Simplified Chinese, English, Japanese, Korean, French, German, and Spanish.
- Native local-image picker for inserting Markdown images.
- Project showcase image, refreshed bilingual README, macOS/Linux build notes, and an AI-assisted development statement.

### Changed

- Reworked the title bar into focus mode, theme control, and standard Windows minimize, maximize/restore, and close controls.
- Improved responsive toolbar overflow for windowed layouts.
- Updated the application version to 0.2.0.

### Fixed

- Outline navigation now lands on the exact heading in visual preview.
- Relative local images render correctly in opened Markdown files and can be removed in visual editing.
- Removed the misleading auto-save status and legacy auto-save restoration behavior.
- Fixed the missing About dialog icon.
