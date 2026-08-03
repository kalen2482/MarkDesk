export const SAMPLE_CONTENT = `# MarkDesk Markdown 语法示例

> 一份可直接编辑的示例文档，覆盖 CommonMark、GFM 与 MarkDesk 扩展语法。

[TOC]

## 文本与标题

这是**粗体**、*斜体*、***粗斜体***、~~删除线~~、<u>下划线</u> 与 ==高亮文本==；也可以写行内代码 \`const app = 'MarkDesk'\`、上标 H<sub>2</sub>O 和快捷键 <kbd>Ctrl</kbd> + <kbd>S</kbd>。

### 链接与图片

- [MarkDesk 项目主页](https://github.com/)
- 自动链接：https://example.com
- ![示例占位图](https://placehold.co/960x260/EEF4FF/2563EB?text=MarkDesk)

## 列表、引用与分隔线

- 无序列表
  - 支持嵌套项目
  - 第二个项目
1. 有序列表
2. 第二项

- [x] 已完成的任务
- [ ] 待完成的任务

> 引用可以有多行。
>
> 也可用于摘录重要说明。

---

## 表格与代码

| 语法 | 标准/扩展 | 状态 |
| :--- | :---: | ---: |
| 标题、段落、列表 | CommonMark | 支持 |
| 表格、任务、删除线 | GFM | 支持 |
| 数学、图表、提示块 | MarkDesk 扩展 | 支持 |

\`\`\`ts
type EditorMode = 'edit' | 'split' | 'visual'

const welcome = (name: string): string => \`欢迎使用 \${name}\`
console.log(welcome('MarkDesk'))
\`\`\`

## 数学公式

行内公式：$E = mc^2$。

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## 提示块与脚注

> [!TIP]
> 提示块适合放置操作建议、注意事项和补充说明。

这句话带有脚注[^note]，方便引用补充信息。

[^note]: 脚注内容会汇总显示在文档末尾。

## Mermaid 图表

\`\`\`mermaid
flowchart LR
  A[编写 Markdown] --> B[实时预览]
  B --> C[专注创作]
\`\`\`

## HTML 与转义字符

<details>
<summary>点击展开 HTML 示例</summary>

Markdown 中可混用有限的 HTML 标签。
</details>

使用反斜杠显示 \\*星号\\*、\\#井号和 \\[方括号\\]。

###### 六级标题

文档结束。`
