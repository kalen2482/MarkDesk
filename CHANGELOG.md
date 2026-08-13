# Changelog

All notable changes to MarkDesk are documented here.

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
