# MarkDesk 技术文档：代码框架与功能逻辑

> 版本：v1.0 | 更新日期：2026-07-31 | 项目路径：`D:\markdesk`

---

## 1. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.5.3 | 类型系统 |
| Vite | 5.4.21 | 构建 + Dev Server |
| Tailwind CSS | 3.4.6 | 原子化样式 |
| marked | 12.0.2 | Markdown → HTML 解析 |
| marked-highlight | 2.1.0 | 代码高亮集成 |
| marked-gfm-heading-id | 3.2.0 | 标题 ID 生成 |
| highlight.js | 11.9.0 | 代码语法高亮 |
| KaTeX | 0.18.1 | 数学公式渲染 |
| Mermaid | 11.16.0 | 图表渲染 |
| DOMPurify | 3.0.9 | HTML 消毒防 XSS |
| Turndown | 7.2.4 | HTML → Markdown 反向转换 |
| turndown-plugin-gfm | 1.0.2 | GFM 扩展规则 |

---

## 2. 项目结构

```
D:\markdesk/
├── index.html                  # 入口 HTML，引入 KaTeX CDN CSS
├── package.json                # 依赖与脚本
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # Tailwind 主题配置
├── postcss.config.js           # PostCSS 配置
├── audit-report.html           # 代码审查报告
├── test-sync.md                # 双向同步测试文件
├── MarkDesk-PRD.md             # 产品需求文档
├── MarkDesk-技术文档.md         # 本文档
├── dist/                       # 构建产出
├── public/                     # 静态资源
└── src/
    ├── main.tsx                # 应用入口，包裹 ErrorBoundary
    ├── App.tsx                 # 主组件（~1290行），状态管理 + 事件分发
    ├── types.ts                # 类型定义
    ├── vite-env.d.ts           # Vite 环境类型
    ├── turndown-plugin-gfm.d.ts # turndown-plugin-gfm 类型声明
    ├── components/
    │   ├── TitleBar.tsx        # 顶部标题栏（文件名、主题、文件操作）
    │   ├── Toolbar.tsx         # 工具栏（格式化按钮、字号、颜色、插入、模式切换）
    │   ├── TabBar.tsx          # 多标签页栏
    │   ├── Sidebar.tsx         # 侧边栏（大纲导航 + 文件列表）
    │   ├── Editor.tsx          # 源码编辑器（textarea + 行号 + 智能输入）
    │   ├── Preview.tsx         # 预览组件（contenteditable + Mermaid 异步渲染）
    │   ├── StatusBar.tsx       # 底部状态栏
    │   ├── SearchPanel.tsx     # 搜索替换面板
    │   ├── SettingsPanel.tsx   # 设置面板
    │   ├── ContextMenu.tsx     # 右键菜单
    │   ├── ShortcutHelp.tsx    # 快捷键帮助弹窗
    │   ├── EmojiPicker.tsx     # Emoji 选择器（8 分类 + 搜索）
    │   ├── Resizer.tsx         # 可拖拽分隔线
    │   ├── ErrorBoundary.tsx   # React 错误边界
    │   └── Icons.tsx           # SVG 图标库
    ├── utils/
    │   ├── markdown.ts         # Markdown 渲染管线
    │   ├── htmlToMarkdown.ts   # HTML → Markdown 反向转换
    │   ├── richTextActions.ts  # 可视化模式富文本操作（execCommand）
    │   ├── editorActions.ts    # 源码模式文本操作
    │   └── sampleContent.ts    # 示例文档内容
    └── styles/
        └── preview.css         # 预览区样式（Markdown 渲染 + contenteditable）
```

---

## 3. 核心架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                     App.tsx                         │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ TitleBar  │  │ Toolbar  │  │    TabBar        │  │
│  └──────────┘  └────┬─────┘  └──────────────────┘  │
│                     │                                 │
│                     ▼ applyAction(action, value)     │
│  ┌──────────────────────────────────────────────┐   │
│  │              isPreviewFocused()?              │   │
│  │                                              │   │
│  │   YES → dispatchRtAction()   NO → textarea   │   │
│  │         (execCommand)             操作        │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Sidebar  │  │  Editor  │  │     Preview      │  │
│  │ (大纲)   │  │ (textarea)│  │ (contenteditable)│  │
│  └──────────┘  └────┬─────┘  └────────┬─────────┘  │
│                     │                  │             │
│                     │   syncSource     │             │
│                     │   = 'editor'     │  = 'preview'│
│                     ▼                  ▼             │
│              handleContent      handlePreview       │
│              Change()           HtmlChange()        │
│                     │                  │             │
│                     ▼                  ▼             │
│              ┌─────────────────────────────┐        │
│              │     updateActiveTab()       │        │
│              │     pushHistory()           │        │
│              └─────────────────────────────┘        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │StatusBar │  │SearchPanel│  │ SettingsPanel    │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 三种显示模式

```typescript
type DisplayMode = 'edit' | 'preview' | 'split' | 'visual'
// 实际使用：edit / split / visual（preview 已移除，自动转换为 visual）
```

| 模式 | Editor 渲染 | Preview 渲染 | editable |
|------|------------|-------------|----------|
| edit | 显示 | 不显示 | false |
| split | 显示 | 显示 | true |
| visual | 不显示 | 显示 | true |

---

## 4. 核心逻辑

### 4.1 Markdown 渲染管线 (`markdown.ts`)

```
输入: Markdown 文本
  │
  ├─ 1. 预处理：脚注定义提取
  ├─ 2. 预处理：$$...$$ 块级公式 → KaTeX renderToString → 占位符
  ├─ 3. 预处理：$...$ 行内公式 → KaTeX renderToString → 占位符
  ├─ 4. 预处理：==高亮== → <mark> → 占位符
  ├─ 5. 预处理：<u>下划线</u> → 占位符
  ├─ 6. 预处理：Callout > [!TYPE] → HTML div → 占位符
  ├─ 7. 预处理：[TOC] → HTML nav → 占位符
  ├─ 8. marked.parse() 解析剩余 Markdown
  ├─ 9. 恢复所有占位符
  ├─ 10. 追加脚注列表
  └─ 11. DOMPurify.sanitize() 消毒
  │
输出: 安全 HTML 字符串
```

**关键设计：占位符机制**

占位符格式：`MDPHX{n}MDPHX`（无 Markdown 特殊字符，不会被 marked 误解析）

每个扩展语法元素在预处理阶段被提取为占位符，其 HTML 渲染结果存储在 Map 中。marked 解析后，占位符被恢复为实际 HTML。

### 4.2 HTML → Markdown 反向转换 (`htmlToMarkdown.ts`)

```
输入: 预览区 innerHTML
  │
  ├─ 1. 解析为 DOM
  ├─ 2. 预处理：Mermaid div → 文本占位符（避免 Turndown 处理 SVG）
  ├─ 3. 预处理：KaTeX block/inline → 文本占位符
  ├─ 4. 预处理：移除 KaTeX MathML（屏幕阅读器噪音）
  ├─ 5. Turndown 转换（含自定义规则）
  │     ├─ color-span: <span style="color/background/font-size"> → 保留 outerHTML
  │     ├─ callout: data-md-src → 原始 Markdown
  │     ├─ mermaid: data-mermaid → ```mermaid 代码块
  │     ├─ katex: data-md-src → $$...$$ / $...$
  │     ├─ highlight: <mark> → ==文本==
  │     ├─ underline: <u> → <u>文本</u>（保留 HTML）
  │     ├─ footnote-ref: data-md-src → [^1]
  │     ├─ toc: data-md-src → [TOC]
  │     ├─ footnotes-section: 重建脚注定义
  │     └─ task-list-item: <input checked> → - [x]
  ├─ 6. 恢复 Mermaid/KaTeX 占位符
  └─ 7. 清理多余空行
  │
输出: 干净的 GFM Markdown
```

**关键设计：data-md-src 属性**

每个扩展语法元素在正向渲染时，将原始 Markdown 源码以 `data-md-src` 属性（URL 编码）存储在 HTML 中。反向转换时直接提取该属性，无需复杂 DOM 逆向解析。

### 4.3 双向同步机制

```
                    syncSource 状态
                    ┌──────────────┐
                    │ 'editor'     │ → Preview 重新渲染（markdown→HTML）
                    │ 'preview'    │ → Preview 跳过渲染（避免覆盖用户编辑）
                    │ null         │ → Preview 重新渲染
                    └──────────────┘

源码编辑流程:
  textarea onChange
    → syncSourceRef.current = 'editor'
    → setSyncSource('editor')
    → updateActiveTab(content)
    → pushHistory(content)
    → Preview useEffect 检测 syncSource !== 'preview' → 重新渲染

可视化编辑流程:
  contenteditable onInput
    → 500ms 防抖
    → htmlToMarkdown(innerHTML)
    → handlePreviewHtmlChange(md)
    → syncSourceRef.current = 'preview'
    → setSyncSource('preview')
    → updateActiveTab(content)
    → pushHistory(content)
    → Preview useEffect 检测 syncSource === 'preview' → 跳过渲染

撤销/重做流程:
  handleUndo / handleRedo
    → syncSourceRef.current = 'editor'
    → setSyncSource('editor')
    → updateActiveTab(historyContent)
    → Preview 重新渲染
```

**防循环三层防护**：
1. `syncSource` 状态标记：区分内容变更来源
2. `isInternalUpdate` ref：Preview 内部渲染时设为 true，阻止 onInput 触发
3. 500ms 防抖：避免每次按键都触发 Turndown 转换

### 4.4 工具栏操作分发 (`applyAction`)

```typescript
function applyAction(action: string, value?: string) {
  // 1. 检查预览区是否聚焦（可视化/分栏模式）
  if (isPreviewFocused()) {
    const handled = dispatchRtAction(action, value)
    if (handled) return  // 富文本操作完成
  }

  // 2. 回退到源码 textarea 操作
  const ta = textareaRef.current
  if (!ta) return

  // 3. 根据 action 类型操作 textarea
  switch (action) {
    case 'bold': toggleWrapSelection(text, start, end, '**')
    case 'heading': setHeadingLevel(text, start, end, level)
    case 'text-color': applyTextColor(text, start, end, color)
    // ... 30+ 操作
  }

  // 4. 更新内容 + 历史 + 恢复选区
  ta.value = result.text
  updateActiveTab({ content: result.text })
  pushHistory(result.text)
  ta.selectionStart = result.start
  ta.selectionEnd = result.end
}
```

### 4.5 富文本操作 (`richTextActions.ts`)

| 操作类型 | 实现方式 | 示例 |
|---------|---------|------|
| 格式切换 | `execCommand('bold'/'italic'/...)` | B, I, S, U |
| 块级格式 | `execCommand('formatBlock', false, '<h1>')` | 标题, 引用 |
| 列表 | `execCommand('insertUnorderedList')` | UL, OL |
| 颜色 | `execCommand('foreColor'/'hiliteColor')` | 字体颜色, 背景色 |
| 字号 | `range.surroundContents(span)` | 字号, A+, A- |
| 插入元素 | `insertHtmlAtCursor(html)` | 表格, 代码块, Mermaid |
| 受保护元素 | data-md-src 属性 + Turndown 规则 | KaTeX, Mermaid, Callout |

**选区保持机制**：
- `saveSelection()` / `restoreSelection()` 在操作前后保存/恢复 Range
- `wrapSelectionWithStyle()` 包裹后重新选中包裹的内容
- `insertHtmlAtCursor()` 插入后光标定位到插入内容之后

### 4.6 多标签页 + 历史栈

```typescript
// 每个标签页独立的历史栈
historyMapRef = useRef<Map<string, { stack: string[]; index: number }>>

// 惰性初始化
function getHistory(tabId: string) {
  let h = historyMapRef.current.get(tabId)
  if (!h) {
    h = { stack: [tab.content], index: 0 }
    historyMapRef.current.set(tabId, h)
  }
  return h
}

// 切换标签时不重置历史（修复点）
function handleTabClick(id: string) {
  setActiveTabId(id)
  updateHistoryFlags()  // 仅更新按钮状态，不重置历史
}
```

### 4.7 自动保存

```typescript
// tabsRef 避免 tabs 在依赖数组中导致 interval 每次按键重建
const tabsRef = useRef(tabs)
tabsRef.current = tabs

useEffect(() => {
  if (settings.autoSave) {
    autoSaveTimer.current = setInterval(() => {
      localStorage.setItem('markdesk-autosave', JSON.stringify(tabsRef.current))
    }, settings.autoSaveInterval * 1000)
  }
}, [settings.autoSave, settings.autoSaveInterval])  // 不依赖 tabs
```

---

## 5. 已实现功能清单

### 5.1 编辑模式

- [x] 源码模式（textarea + 行号 + 智能输入）
- [x] 分栏模式（左源码 + 右预览，双向同步）
- [x] 可视化模式（contenteditable，类 Notion）
- [x] 模式切换按钮 + 快捷键（Ctrl+E / Ctrl+R）
- [x] 默认打开模式设置

### 5.2 文本格式

- [x] 加粗 / 斜体 / 删除线 / 下划线
- [x] 行内代码
- [x] 标题 H1-H6 + 正文切换
- [x] 字号下拉框（12-32px 预设）
- [x] A+ / A- 逐级字号调整
- [x] 字体颜色（16 色预设 + 自定义取色器 + 清除）
- [x] 背景颜色（16 色预设 + 自定义取色器）
- [x] 高亮标记（==文本==）

### 5.3 列表与块级元素

- [x] 无序列表 / 有序列表 / 任务列表
- [x] 增加缩进 / 减少缩进
- [x] 引用块
- [x] 智能列表续行（Enter 自动添加列表标记）

### 5.4 插入元素

- [x] 超链接（弹窗输入 URL）
- [x] 图片（弹窗输入 URL / 粘贴剪贴板图片）
- [x] 表格（3×3 默认）
- [x] 代码块（带语言标注 + 语法高亮）
- [x] 分隔线
- [x] Mermaid 图表（流程图/时序图等，异步渲染）
- [x] Callout 提示框（INFO/WARNING/TIP/NOTE/DANGER）
- [x] 脚注（引用 + 定义 + 底部列表）
- [x] 目录 [TOC]（自动生成）
- [x] 数学公式（块级 $$ + 行内 $，KaTeX 渲染）
- [x] 日期时间插入
- [x] Emoji 选择器（8 分类 + 搜索栏）

### 5.5 文件操作

- [x] 新建文件 / 打开文件 / 保存 / 另存为
- [x] 导出 HTML / 导出 PDF（浏览器打印）
- [x] 拖放打开 .md 文件
- [x] 粘贴剪贴板图片
- [x] 最近打开文件记录

### 5.6 编辑辅助

- [x] 多标签页（独立历史栈）
- [x] 撤销 / 重做（Ctrl+Z / Ctrl+Y，最多 100 步）
- [x] 搜索 / 替换 / 全部替换（支持正则表达式）
- [x] 大纲导航（自动提取标题，点击跳转）
- [x] 右键菜单（剪切/复制/粘贴/格式化/插入）
- [x] 自动配对括号/引号
- [x] Tab 缩进 / Shift+Tab 反缩进

### 5.7 界面交互

- [x] 深色模式（Mermaid 自适应主题）
- [x] 专注模式（F11 全屏）
- [x] 工具栏 Tooltip（功能名 + 快捷键 + 语法）
- [x] 快捷键帮助面板（Ctrl+/）
- [x] 设置面板（字体/Tab/换行/行号/拼写/保存/滚动/默认模式）
- [x] 滚动同步（编辑器 ↔ 预览区）
- [x] 可拖拽分隔线（侧边栏 + 编辑器/预览比例）
- [x] 自动保存（localStorage，定时 + 关闭时保存）
- [x] ErrorBoundary 错误边界

### 5.8 安全性

- [x] DOMPurify HTML 消毒
- [x] 禁止危险标签（script/iframe/form）
- [x] 禁止事件属性（onerror/onload 等）
- [x] Mermaid securityLevel: strict

---

## 6. 关键技术决策

### 6.1 marked v12 renderer 签名

marked v12 的 renderer 方法使用位置参数而非对象：

```typescript
// 正确（v12）
renderer.code = function(code: string, infostring: string, escaped: boolean) { ... }

// 错误（v11 风格，在 v12 中得到 undefined）
renderer.code = function({ text, lang, escaped }) { ... }
```

### 6.2 占位符格式选择

```
MDPHX{n}MDPHX  ✅ 无 Markdown 特殊字符
__MDPH{n}__    ❌ 双下划线被 marked 解析为加粗
```

### 6.3 Callout 预处理 vs Renderer

marked v12 的 blockquote renderer 收到的是已渲染的 HTML，无法匹配原始 `> [!TYPE]` 语法。因此 Callout 在 marked 解析前用正则预处理提取。

### 6.4 Mermaid SVG 处理

Mermaid 渲染后生成 SVG，Turndown 无法正确处理。解决方案：
1. 正向渲染时将原始代码存入 `data-mermaid` 属性
2. 反向转换前将 Mermaid div 替换为文本占位符
3. Turndown 处理后再恢复为 ` ```mermaid ` 代码块

### 6.5 下划线语法

GFM 中 `__text__` 是加粗语法，不能用于下划线。改用 `<u>text</u>` HTML 标签，Obsidian 兼容。

### 6.6 document.execCommand

虽然 execCommand 已被标记为 deprecated，但它仍是操作 contenteditable 选区最可靠的方式。所有富文本操作都基于 execCommand，并在操作后手动触发 input 事件以启动 Turndown 转换管线。

---

## 7. 已知限制

1. **浏览器文件系统**：无法直接读写本地文件，依赖下载/上传。后续可通过 Electron 解决
2. **execCommand 兼容性**：不同浏览器对 hiliteColor/backColor 支持不一致，已添加回退
3. **Turndown 精度**：复杂嵌套 HTML 反向转换可能丢失部分格式，通过 data-md-src 属性保护扩展语法
4. **图片存储**：粘贴的图片以 base64 data URL 存储在 Markdown 中，大图片会增大文件体积

---

## 8. 开发与构建

### 8.1 环境要求

- Node.js >= 18
- npm >= 9

### 8.2 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 5173，可通过 --port 指定）
npm run dev -- --port 3210

# 类型检查
npx tsc --noEmit

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 8.3 打包为可执行文件

Vite 构建产出的是静态文件（dist/），可通过以下方式打包为 Windows 可执行文件：

1. **Electron**：`npm install electron --save-dev`，创建主进程加载 dist/index.html
2. **Tauri**：`npm install @tauri-apps/cli`，Rust 后端 + WebView 前端
