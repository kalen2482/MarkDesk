<p align="center">
  <img src="public/markdesk-icon.svg" width="104" alt="MarkDesk 图标" />
</p>

<h1 align="center">MarkDesk</h1>

<p align="center">
  <strong>为 Windows 打造的轻量、本地优先 Markdown 创作桌面。</strong><br />
  写 Markdown · 直接编辑渲染文档 · 文件始终留在本机。
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-为什么选择-markdesk">为什么选择 MarkDesk？</a> ·
  <a href="#-参与贡献">参与贡献</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/平台-Windows-4f7df3?style=flat-square" alt="Windows" />
  <img src="https://img.shields.io/badge/协议-Apache--2.0-6f42c1?style=flat-square" alt="Apache 2.0" />
  <img src="https://img.shields.io/badge/隐私-本地优先-12a594?style=flat-square" alt="本地优先" />
</p>

<p align="center">
  <img src="docs/images/markdesk-preview.png" alt="MarkDesk 可视化编辑界面" width="100%" />
</p>

## ✨ 为什么选择 MarkDesk？

Markdown 足够开放、便携，但只面对源码的编辑方式有时会打断创作思路。MarkDesk 将两种体验放进一个专注的桌面应用：需要精确控制时写源码，需要在页面上思考时直接编辑可视化文档。

| ✍️ 按自己的方式写作 | 🔒 文件只属于你 | 🪟 更像 Windows 软件 |
| --- | --- | --- |
| 源码、分栏、可视化三种模式，随任务自由切换。 | 无需账号、无云同步、不在服务端处理文档。 | 系统图片选择器、标准窗口按键、主题、专注模式与 Markdown 文件关联。 |

## 🚀 核心特性

- **↔️ 双向编辑**：既可编辑 Markdown 源码，也可直接编辑渲染后的文档，两种内容保持同步。
- **🧭 长文档导航**：根据标题实时生成目录，点击即可精确定位到对应章节。
- **🧩 丰富而克制的 Markdown 支持**：CommonMark、GFM 表格与任务列表、代码高亮、KaTeX、Mermaid、提示块、脚注、高亮、下划线和 `[TOC]`。
- **🖼️ 本地图片工作流**：通过系统文件选择器插入图片，并可直接显示 Markdown 中的相对路径图片。
- **🌗 舒适的写作环境**：深浅主题、专注模式、快捷键、查找替换、字数统计与滚动同步。
- **📁 自然地打开文件**：安装后可关联 `.md`、`.markdown`、`.mdx` 文件类型。

## ⚡ 快速开始

### 安装 Windows 应用

从项目 Releases 下载并运行最新的 Windows 安装包。安装完成后，可以在文件资源管理器中直接用 MarkDesk 打开 Markdown 文件。

### 从源码运行

> 需要 Node.js 18 或更高版本。

```bash
git clone https://github.com/kalen2482/MarkDesk.git
cd MarkDesk
npm install
npm run dev
```

### 构建 Windows 安装包

```bash
npm run build
npm run dist:win
```

### 在 macOS 或 Linux 上构建

MarkDesk 基于 Electron，同一份源代码也可在 macOS 和 Linux 上构建。安装 Node.js 18+ 后运行：

```bash
npm install
npm run build
```

如需生成发行包，请在对应目标系统执行 `electron-builder`：macOS 可生成 `.dmg`，Linux 可生成 AppImage、deb 或 rpm。跨平台签名和 macOS 公证仍需要对应系统的证书与凭据。

## 🛠️ 开发框架

| 模块 | 技术方案 |
| --- | --- |
| 桌面运行时 | Electron |
| 用户界面 | React + TypeScript |
| 构建工具 | Vite |
| 样式系统 | Tailwind CSS |
| Markdown 渲染 | marked + highlight.js |
| 公式与图表 | KaTeX + Mermaid |
| HTML 安全过滤 | DOMPurify |
| Windows 打包 | electron-builder + NSIS |

## 🔐 隐私说明

MarkDesk 不会将文档内容上传到云端，文档只在本地读取和写入。请注意：若 Markdown 中包含外部链接或外部图片，打开文档时这些资源仍可能发起网络请求；如需完全离线，请使用本地资源。

## 🤝 参与贡献

欢迎提交 Issue、功能建议和 Pull Request。提交代码前，请说明要解决的问题，并运行 `npm run build` 确保项目可以正常构建。

## 🤖 AI 辅助开发声明

MarkDesk 的源代码采用 AI 辅助工程工作流完成。产品方向、代码审查、构建测试及最终发布决定均由人工维护者负责。

## 📄 开源许可

MarkDesk 基于 [Apache License 2.0](LICENSE) 发布。
