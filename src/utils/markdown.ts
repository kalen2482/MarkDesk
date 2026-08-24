import { marked } from 'marked'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import DOMPurify from 'dompurify'
import katex from 'katex'
import type { HeadingNode } from '../types'
import { protectIncompleteSetextUnderline } from './editorInput'

// ── Marked configuration ──
marked.use(
  gfmHeadingId(),
)

marked.setOptions({
  gfm: true,
  breaks: false,
})

// ── Custom renderer overrides ──
const renderer = new marked.Renderer()

// Mermaid code blocks → placeholder (rendered by Preview component)
const originalCode = (renderer.code as any).bind(renderer)
;(renderer as any).code = function(code: string, infostring: string | undefined, escaped: boolean) {
  if (infostring === 'mermaid') {
    // marked v12 HTML-escapes code content; unescape before encoding
    const raw = code.trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    return `<div class="mermaid-diagram" data-mermaid="${encodeURIComponent(raw)}"><div class="mermaid-placeholder">Mermaid 图表</div></div>`
  }
  return originalCode(code, infostring, escaped)
}

marked.use({ renderer })

// ── Placeholder helpers ──
let _phCounter = 0
const resetPh = () => { _phCounter = 0 }
const ph = () => `MDPHX${++_phCounter}MDPHX`

/**
 * Main render pipeline:
 * 1. Pre-process: KaTeX math, ==highlight==, [TOC], footnotes
 * 2. marked parse
 * 3. Post-process: replace placeholders
 */
export function renderMarkdown(content: string, sourcePath?: string): string {
  resetPh()
  const placeholders: Map<string, string> = new Map()

  const imageSources: string[] = []
  let sourceImageIndex = 0
  const processedImagePaths = sourcePath
    ? content.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g, (match, alt, url) => {
        if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(url)) return match
        imageSources.push(url)
        const directory = sourcePath.replace(/[\\/][^\\/]*$/, '')
        const absolutePath = /^[a-z]:[\\/]/i.test(url)
          ? url
          : `${directory}\\${url.replace(/^\.?[\\/]/, '')}`
        const fileUrl = `file:///${absolutePath.replace(/\\/g, '/')}`
        return `![${alt}](${encodeURI(fileUrl)})`
      })
    : content

  // ── 1. Footnotes: collect definitions & references ──
  const embeddedImageProcessed = processedImagePaths.replace(/!\[([^\]]*)\]\((data:image\/(?:png|jpeg|gif|webp|svg\+xml|bmp);base64,[A-Za-z0-9+/=]+)\)/gi, (_match, alt, dataUrl) => {
    const key = ph()
    placeholders.set(key, `<img src="${dataUrl}" alt="${String(alt).replace(/"/g, '&quot;')}">`)
    return key
  })
  const footnotes: Map<string, string> = new Map()
  let processed = protectIncompleteSetextUnderline(embeddedImageProcessed).replace(/^\[(\^\w+)\]:\s*(.+)$/gm, (_match, id, text) => {
    footnotes.set(id, text)
    return ''
  })

  // Replace footnote refs with placeholders
  processed = processed.replace(/\[(\^\w+)\]/g, (_match, id) => {
    const key = ph()
    placeholders.set(key, `<sup class="footnote-ref" data-md-src="[${id}]"><a href="#fn-${id.slice(1)}" id="fnref-${id.slice(1)}">${id}</a></sup>`)
    return key
  })

  // ── 2. Block-level math $$...$$ ──
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
    try {
      const rawTex = tex.trim()
      const html = katex.renderToString(rawTex, { displayMode: true, throwOnError: false })
      const key = ph()
      placeholders.set(key, `<div class="katex-block" data-md-src="${encodeURIComponent('$$' + rawTex + '$$')}">${html}</div>`)
      return key
    } catch {
      return match
    }
  })

  // ── 3. Inline math $...$ (not preceded/followed by $) ──
  processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)\$/g, (match, tex) => {
    try {
      const rawTex = tex.trim()
      const html = katex.renderToString(rawTex, { displayMode: false, throwOnError: false })
      const key = ph()
      placeholders.set(key, `<span class="katex-inline" data-md-src="${encodeURIComponent('$' + rawTex + '$')}">${html}</span>`)
      return key
    } catch {
      return match
    }
  })

  // ── 4. Highlight syntax ==text== ──
  processed = processed.replace(/==(.+?)==/g, (_match, inner) => {
    const key = ph()
    placeholders.set(key, `<mark>${inner}</mark>`)
    return key
  })

  // ── 4a. Underline <u>text</u> — protect from marked parsing ──
  processed = processed.replace(/<u>(.+?)<\/u>/g, (_match, inner) => {
    const key = ph()
    placeholders.set(key, `<u>${inner}</u>`)
    return key
  })

  // ── 4b. Callout blocks: > [!TYPE]
  processed = processed.replace(/^>\s*\[!(INFO|WARNING|TIP|NOTE|DANGER)\]\s*\n((?:>\s?.*\n?)+)/gim, (match, type, body) => {
    const titles: Record<string, string> = { info: '信息', warning: '警告', tip: '提示', note: '笔记', danger: '危险' }
    const innerMd = body.replace(/^>\s?/gm, '').trim()
    const innerHtml = marked.parse(innerMd, { async: false }) as string
    const originalMd = match.trim()
    const key = ph()
    placeholders.set(key, `<div class="callout callout-${type.toLowerCase()}" data-callout-type="${type.toLowerCase()}" data-md-src="${encodeURIComponent(originalMd)}"><div class="callout-title">${titles[type.toLowerCase()] || type}</div><div class="callout-content">${innerHtml}</div></div>`)
    return key
  })

  // ── 5. [TOC] ──
  const tocHeadings = extractHeadings(content)
  processed = processed.replace(/\[TOC\]/g, () => {
    const key = ph()
    placeholders.set(key, `<div class="md-toc-wrapper" data-md-src="[TOC]">${generateTocHtml(tocHeadings)}</div>`)
    return key
  })

  // ── 6. Parse with marked ──
  let html = marked.parse(processed, { async: false }) as string

  // Keep the original local path so visual editing round-trips back to the
  // Markdown source rather than persisting an absolute file:// URL.
  html = html.replace(/<img\b([^>]*?)>/g, (tag) => {
    if (!/src="file:\/\//i.test(tag)) return tag
    const original = imageSources[sourceImageIndex++]
    return original ? tag.replace(/\s*\/?>(\s*)$/, ` data-md-src="${encodeURIComponent(original)}">$1`) : tag
  })

  // Preserve the source line for every heading. DOM order can diverge from
  // Markdown order when extensions (for example callouts) contain headings.
  const headingLines = tocHeadings
  let headingIndex = 0
  html = html.replace(/<h([1-6])(\b[^>]*)>/g, (tag, level, attributes) => {
    const heading = headingLines[headingIndex++]
    return heading ? `<h${level}${attributes} data-line="${heading.line}">` : tag
  })

  // ── 7. Replace placeholders ──
  for (const [key, val] of placeholders) {
    html = html.replace(key, val)
  }

  // ── 8. Append footnotes list at end ──
  if (footnotes.size > 0) {
    const fnItems = Array.from(footnotes.entries()).map(([id, text]) =>
      `<li id="fn-${id.slice(1)}">${text} <a href="#fnref-${id.slice(1)}">↩</a></li>`
    ).join('')
    html += `<div class="footnotes"><hr><ol>${fnItems}</ol></div>`
  }

  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'id', 'data-line', 'data-mermaid', 'data-md-src', 'data-callout-type', 'href', 'style'],
    ADD_TAGS: ['mark', 'div', 'sup', 'span'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseenter', 'onmouseleave', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    FORBID_TAGS: ['script', 'iframe', 'form', 'textarea', 'button', 'object', 'embed'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|file):|data:image\/(?:png|jpeg|gif|webp|svg\+xml|bmp);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  })
}

function generateTocHtml(headings: HeadingNode[]): string {
  if (headings.length === 0) return ''
  const build = (nodes: HeadingNode[], depth: number): string => {
    if (nodes.length === 0) return ''
    const items = nodes.map(n => {
      const children = build(n.children, depth + 1)
      return `<li><a href="#${n.id}" data-line="${n.line}">${n.text}</a>${children}</li>`
    }).join('')
    return `<ul class="toc-list" style="padding-left:${depth === 0 ? 0 : 16}px">${items}</ul>`
  }
  return `<nav class="md-toc"><div class="toc-title">目录</div>${build(headings, 0)}</nav>`
}

export function extractHeadings(content: string): HeadingNode[] {
  const lines = content.split('\n')
  const headings: HeadingNode[] = []
  let inCodeBlock = false

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      return
    }
    if (inCodeBlock) return

    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
      headings.push({
        level,
        text,
        id,
        line: index,
        children: [],
      })
    }
  })

  return headings
}

export function buildHeadingTree(headings: HeadingNode[]): HeadingNode[] {
  const root: HeadingNode[] = []
  const stack: HeadingNode[] = []

  for (const h of headings) {
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(h)
    } else {
      stack[stack.length - 1].children.push(h)
    }
    stack.push(h)
  }

  return root
}

export function countWords(text: string): { words: number; chars: number; lines: number } {
  const lines = text.split('\n')
  const chars = text.length
  const cjkChars = (text.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g) || []).length
  const nonCjkText = text.replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, ' ')
  const westernWords = nonCjkText.trim().split(/\s+/).filter((w) => w.length > 0).length
  const words = cjkChars + westernWords

  return { words, chars, lines: lines.length }
}

export function getReadingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 300))
}
