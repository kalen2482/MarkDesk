/**
 * Rich text actions for contenteditable preview.
 * Uses document.execCommand for formatting, which is still the most reliable
 * way to manipulate contenteditable selections in browsers.
 *
 * After any execCommand, the contenteditable's input event fires,
 * which triggers the debounced htmlToMarkdown → onHtmlChange pipeline.
 */

// Check if there's a selection inside the contenteditable preview
export function getPreviewSelection(): Selection | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  const preview = document.querySelector('.md-preview')
  if (!preview) return null
  if (!preview.contains(range.commonAncestorContainer)) return null
  return sel
}

export function isPreviewFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  return active.classList?.contains('md-preview') || active.closest('.md-preview') != null
}

/** Capture the visual-editor selection before a native dialog steals focus. */
export function capturePreviewRange(): Range | null {
  const selection = window.getSelection()
  const preview = document.querySelector('.md-preview')
  if (!selection || !preview || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  return preview.contains(range.commonAncestorContainer) ? range.cloneRange() : null
}

/** Insert an image at a previously captured visual-editor range. */
export function insertImageAtPreviewRange(range: Range, src: string, alt: string): boolean {
  const preview = document.querySelector('.md-preview') as HTMLElement | null
  if (!preview || !preview.contains(range.commonAncestorContainer)) return false

  const image = document.createElement('img')
  image.src = src
  image.alt = alt
  // Preserve data URLs when the preview is converted back into Markdown.
  image.setAttribute('data-md-src', encodeURIComponent(src))

  range.deleteContents()
  range.insertNode(image)
  range.setStartAfter(image)
  range.collapse(true)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  preview.focus()
  preview.dispatchEvent(new Event('input', { bubbles: true }))
  return true
}

// Focus the preview and ensure a selection exists
function ensureFocus(): boolean {
  const preview = document.querySelector('.md-preview') as HTMLElement | null
  if (!preview) return false
  if (!isPreviewFocused()) {
    preview.focus()
  }
  return true
}

// Insert HTML at cursor position in contenteditable
function insertHtmlAtCursor(html: string) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) {
      preview.innerHTML += html
    }
    return
  }
  const range = sel.getRangeAt(0)
  range.deleteContents()
  const frag = range.createContextualFragment(html)
  const lastNode = frag.lastChild
  range.insertNode(frag)
  if (lastNode) {
    range.setStartAfter(lastNode)
    range.setEndAfter(lastNode)
    sel.removeAllRanges()
    sel.addRange(range)
  }
  // Trigger input event
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

// Get selected text or placeholder
function getSelectedTextOrPlaceholder(placeholder: string): string {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const text = sel.toString()
    if (text) return text
  }
  return placeholder
}

// ── Public action functions ──

export function rtBold() {
  if (!ensureFocus()) return
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') {
    insertHtmlAtCursor('<strong>加粗文本</strong>')
  } else {
    document.execCommand('bold')
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

export function rtItalic() {
  if (!ensureFocus()) return
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') {
    insertHtmlAtCursor('<em>斜体文本</em>')
  } else {
    document.execCommand('italic')
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

export function rtStrikethrough() {
  if (!ensureFocus()) return
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') {
    insertHtmlAtCursor('<del>删除线文本</del>')
  } else {
    document.execCommand('strikeThrough')
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

export function rtUnderline() {
  if (!ensureFocus()) return
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') {
    insertHtmlAtCursor('<u>下划线文本</u>')
  } else {
    document.execCommand('underline')
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

export function rtCode() {
  if (!ensureFocus()) return
  const text = getSelectedTextOrPlaceholder('行内代码')
  insertHtmlAtCursor(`<code>${text}</code>`)
}

export function rtHighlight() {
  if (!ensureFocus()) return
  const text = getSelectedTextOrPlaceholder('高亮文本')
  insertHtmlAtCursor(`<mark>${text}</mark>`)
}

export function rtHeading(level: number) {
  if (!ensureFocus()) return
  if (level === 0) {
    // Convert to paragraph
    document.execCommand('formatBlock', false, '<p>')
  } else {
    document.execCommand('formatBlock', false, `<h${level}>`)
  }
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtUnorderedList() {
  if (!ensureFocus()) return
  document.execCommand('insertUnorderedList')
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtOrderedList() {
  if (!ensureFocus()) return
  document.execCommand('insertOrderedList')
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtTaskList() {
  if (!ensureFocus()) return
  const text = getSelectedTextOrPlaceholder('待办事项')
  insertHtmlAtCursor(`<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled> ${text}</li></ul>`)
}

export function rtQuote() {
  if (!ensureFocus()) return
  document.execCommand('formatBlock', false, '<blockquote>')
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtLink() {
  if (!ensureFocus()) return
  const text = getSelectedTextOrPlaceholder('链接文本')
  const url = prompt('请输入链接地址', 'https://')
  if (url) {
    insertHtmlAtCursor(`<a href="${url}">${text}</a>`)
  }
}

export function rtImage() {
  if (!ensureFocus()) return
  const url = prompt('请输入图片地址', 'https://')
  if (url) {
    const alt = prompt('请输入图片描述（可留空）', '图片')
    insertHtmlAtCursor(`<img src="${url}" alt="${alt || ''}" />`)
  }
}

export function rtTable() {
  if (!ensureFocus()) return
  const html = `
<table>
<thead><tr><th>列1</th><th>列2</th><th>列3</th></tr></thead>
<tbody>
<tr><td>内容</td><td>内容</td><td>内容</td></tr>
<tr><td>内容</td><td>内容</td><td>内容</td></tr>
</tbody>
</table>`
  insertHtmlAtCursor(html)
}

export function rtCodeBlock() {
  if (!ensureFocus()) return
  const html = `<pre><code class="language-typescript">// 在此输入代码
</code></pre>`
  insertHtmlAtCursor(html)
}

export function rtHr() {
  if (!ensureFocus()) return
  insertHtmlAtCursor('<hr>')
}

export function rtFormula() {
  if (!ensureFocus()) return
  insertHtmlAtCursor('<div class="katex-block" data-md-src="' + encodeURIComponent('$$E = mc^2$$') + '"><span class="katex">E = mc²</span></div>')
}

export function rtInlineFormula() {
  if (!ensureFocus()) return
  insertHtmlAtCursor('<span class="katex-inline" data-md-src="' + encodeURIComponent('$E=mc^2$') + '">E=mc²</span>')
}

export function rtMermaid() {
  if (!ensureFocus()) return
  const code = 'graph TD\n    A[开始] --> B[结束]'
  insertHtmlAtCursor(`<div class="mermaid-diagram" data-mermaid="${encodeURIComponent(code)}"><div class="mermaid-placeholder">Mermaid 图表</div></div>`)
}

export function rtCallout() {
  if (!ensureFocus()) return
  const md = '> [!INFO]\n> 请输入提示内容。'
  insertHtmlAtCursor(`<div class="callout callout-info" data-callout-type="info" data-md-src="${encodeURIComponent(md)}"><div class="callout-title">信息</div><div class="callout-content"><p>请输入提示内容。</p></div></div>`)
}

export function rtFootnote() {
  if (!ensureFocus()) return
  insertHtmlAtCursor('<sup class="footnote-ref" data-md-src="[^1]"><a href="#fn-1" id="fnref-1">[^1]</a></sup>')
}

export function rtToc() {
  if (!ensureFocus()) return
  insertHtmlAtCursor('<div class="md-toc-wrapper" data-md-src="[TOC]"><nav class="md-toc"><div class="toc-title">目录</div></nav></div>')
}

export function rtIndent() {
  if (!ensureFocus()) return
  document.execCommand('indent')
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtOutdent() {
  if (!ensureFocus()) return
  document.execCommand('outdent')
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtTextColor(color: string) {
  if (!ensureFocus()) return
  if (!color) {
    // Clear color
    document.execCommand('removeFormat')
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') {
    // No selection: insert placeholder text with color
    insertHtmlAtCursor(`<span style="color: ${color}">彩色文字</span>`)
  } else {
    const savedRange = saveSelection()
    document.execCommand('foreColor', false, color)
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
    restoreSelection(savedRange)
  }
}

// Save/restore selection to preserve it across operations
function saveSelection(): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  return sel.getRangeAt(0).cloneRange()
}

function restoreSelection(range: Range | null) {
  if (!range) return
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

// Wrap the current selection in a span with the given style
function wrapSelectionWithStyle(styleStr: string): Range | null {
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') return null

  const range = sel.getRangeAt(0)
  const span = document.createElement('span')
  span.style.cssText = styleStr

  try {
    // surroundContents fails if selection spans multiple elements
    range.surroundContents(span)
  } catch {
    // Fallback: extract contents and wrap
    const contents = range.extractContents()
    span.appendChild(contents)
    range.insertNode(span)
  }

  // Select the wrapped content so user sees it's selected
  const newRange = document.createRange()
  newRange.selectNodeContents(span)
  sel.removeAllRanges()
  sel.addRange(newRange)
  return newRange
}

export function rtFontSize(size: number) {
  if (!ensureFocus()) return
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') {
    insertHtmlAtCursor(`<span style="font-size: ${size}px">字号文字</span>`)
    return
  }
  const newRange = wrapSelectionWithStyle(`font-size: ${size}px`)
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
  // Restore selection
  if (newRange) {
    const sel2 = window.getSelection()
    if (sel2) {
      sel2.removeAllRanges()
      sel2.addRange(newRange)
    }
  }
}

export function rtFontSizeUp() {
  if (!ensureFocus()) return
  const newRange = wrapSelectionWithStyle('font-size: larger')
  if (!newRange) return
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtFontSizeDown() {
  if (!ensureFocus()) return
  const newRange = wrapSelectionWithStyle('font-size: smaller')
  if (!newRange) return
  const preview = document.querySelector('.md-preview') as HTMLElement
  if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
}

export function rtBgColor(color: string) {
  if (!ensureFocus()) return
  const sel = getPreviewSelection()
  if (!sel || sel.toString() === '') {
    // No selection: insert placeholder text with background color
    insertHtmlAtCursor(`<span style="background-color: ${color}">背景色文字</span>`)
  } else {
    const savedRange = saveSelection()
    // Try hiliteColor first, fallback to backColor (browser compatibility)
    if (!document.execCommand('hiliteColor', false, color)) {
      document.execCommand('backColor', false, color)
    }
    const preview = document.querySelector('.md-preview') as HTMLElement
    if (preview) preview.dispatchEvent(new Event('input', { bubbles: true }))
    restoreSelection(savedRange)
  }
}

export function rtDate() {
  if (!ensureFocus()) return
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  insertHtmlAtCursor(dateStr)
}

export function rtEmoji(emoji?: string) {
  if (!ensureFocus()) return
  insertHtmlAtCursor(emoji || '😀')
}

/**
 * Dispatch a rich text action by name.
 * Returns true if the action was handled, false if it should fall back to textarea.
 */
export function dispatchRtAction(action: string, value?: string): boolean {
  switch (action) {
    case 'bold': rtBold(); return true
    case 'italic': rtItalic(); return true
    case 'strikethrough': rtStrikethrough(); return true
    case 'underline': rtUnderline(); return true
    case 'code': rtCode(); return true
    case 'highlight': rtHighlight(); return true
    case 'heading': rtHeading(parseInt(value || '0')); return true
    case 'unordered-list': rtUnorderedList(); return true
    case 'ordered-list': rtOrderedList(); return true
    case 'task-list': rtTaskList(); return true
    case 'quote': rtQuote(); return true
    case 'link': rtLink(); return true
    case 'image': rtImage(); return true
    case 'table': rtTable(); return true
    case 'codeblock': rtCodeBlock(); return true
    case 'hr': rtHr(); return true
    case 'formula': rtFormula(); return true
    case 'inline-formula': rtInlineFormula(); return true
    case 'mermaid': rtMermaid(); return true
    case 'callout': rtCallout(); return true
    case 'footnote': rtFootnote(); return true
    case 'toc': rtToc(); return true
    case 'indent': rtIndent(); return true
    case 'outdent': rtOutdent(); return true
    case 'text-color': rtTextColor(value || '#e74c3c'); return true
    case 'bg-color': rtBgColor(value || '#fff3cd'); return true
    case 'font-size': rtFontSize(parseInt(value || '14')); return true
    case 'font-size-up': rtFontSizeUp(); return true
    case 'font-size-down': rtFontSizeDown(); return true
    case 'date': rtDate(); return true
    case 'emoji': rtEmoji(value); return true
    default: return false
  }
}
