# MarkDesk

[English](README.md)

MarkDesk 是一款面向 Windows 的轻量级、本地优先 Markdown 编辑器。它将 Markdown 源码编辑与可视化富文本编辑结合在同一个桌面应用中，既能保留 Markdown 的可移植性，也能获得接近文档编辑器的创作体验。

## 软件优势

- **双向编辑**：可编辑 Markdown 源码，也可在渲染后的可视化文档中编辑，两种内容双向同步。
- **三种工作视图**：源码、分栏、可视化模式分别适合专注写作、校对和阅读展示。
- **本地优先与隐私保护**：文档和编辑器设置保存于本机；无需注册账号，不上传文档内容到云端。
- **轻量快速**：基于 Electron 桌面运行时与 Vite 构建的 React 界面，专注于 Markdown 创作。
- **丰富 Markdown 支持**：支持 CommonMark、GFM 表格/任务列表/删除线/围栏代码块，并支持 KaTeX 公式、Mermaid 图表、Callout、脚注、高亮、下划线和 `[TOC]` 自动目录。
- **高效导航**：根据标题自动生成大纲，点击可精确跳转到预览文档的对应章节。
- **舒适编辑体验**：语法高亮、查找替换、深色模式、快捷键、字数统计、自动保存与滚动同步。
- **Windows 集成**：提供 NSIS 安装包、自定义图标、桌面与开始菜单快捷方式，并关联 `.md`、`.markdown` 和 `.mdx` 文件。

## 开发框架

| 模块 | 技术方案 |
| --- | --- |
| 桌面运行时 | Electron 31 |
| 用户界面 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| Markdown 解析 | marked、marked-highlight、marked-gfm-heading-id |
| 代码高亮 | highlight.js |
| 数学与图表 | KaTeX、Mermaid |
| 安全过滤 | DOMPurify |
| Windows 打包 | electron-builder（NSIS） |

## 本地开发

需要 Node.js 18+ 与 npm。

```bash
npm install
npm run dev
npm run build
```

生成 Windows 安装包：

```bash
npm run dist:win
```

## 隐私说明

MarkDesk 面向本地文档创作，不提供云端同步、强制登录或服务端文档处理。文档中的外部图片或链接在打开时仍可能被访问；如需完全离线，请避免使用外部 URL。

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源。
