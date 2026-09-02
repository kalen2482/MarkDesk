import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

/**
 * htmlToMarkdown — Convert preview HTML back to clean GFM Markdown.
 *
 * Strategy: Use Turndown with custom rules for extended syntax elements.
 * Each special element (KaTeX, Mermaid, Callout, footnotes, TOC, highlight)
 * carries a `data-md-src` attribute with its original Markdown source,
 * so we reverse-convert by simply extracting that attribute.
 * Regular elements (bold, italic, lists, tables, etc.) are handled by
 * Turndown's native rules + GFM plugin.
 */

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
})

turndown.use(gfm)

turndown.addRule('local-image', {
  filter: (node) => node.nodeName === 'IMG' && (node as HTMLElement).hasAttribute('data-md-src'),
  replacement: (_content, node) => {
    const image = node as HTMLImageElement
    const original = image.getAttribute('data-md-src')
    const src = original ? decodeURIComponent(original) : image.getAttribute('src') || ''
    return `![${image.alt || ''}](${src})`
  },
})

// ── Custom rules for extended syntax ──

// KaTeX block: extract original $$...$$ from data-md-src
turndown.addRule('katex-block', {
  filter: (node) => {
    return node.nodeName === 'DIV' && (node as HTMLElement).classList.contains('katex-block')
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const src = el.getAttribute('data-md-src')
    if (src) return `\n\n${decodeURIComponent(src)}\n\n`
    return ''
  },
})

// KaTeX inline: extract original $...$ from data-md-src
turndown.addRule('katex-inline', {
  filter: (node) => {
    return node.nodeName === 'SPAN' && (node as HTMLElement).classList.contains('katex-inline')
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const src = el.getAttribute('data-md-src')
    if (src) return decodeURIComponent(src)
    return ''
  },
})

// Mermaid diagram: extract from data-mermaid attribute → ```mermaid block
turndown.addRule('mermaid-diagram', {
  filter: (node) => {
    return node.nodeName === 'DIV' && (node as HTMLElement).classList.contains('mermaid-diagram')
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const raw = el.getAttribute('data-mermaid')
    if (raw) {
      const code = decodeURIComponent(raw)
      return `\n\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`
    }
    return ''
  },
})

// Callout: if data-md-src exists, use it; otherwise reconstruct from type + inner content
turndown.addRule('callout', {
  filter: (node) => {
    return node.nodeName === 'DIV' && (node as HTMLElement).classList.contains('callout')
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const src = el.getAttribute('data-md-src')
    if (src) return `\n\n${decodeURIComponent(src)}\n\n`

    // Fallback: reconstruct from type + inner text
    const type = el.getAttribute('data-callout-type') || 'info'
    const contentEl = el.querySelector('.callout-content')
    const innerText = contentEl ? turndown.turndown(contentEl.innerHTML) : ''
    const lines = innerText.split('\n').map((l: string) => `> ${l}`.trimEnd())
    return `\n\n> [!${type.toUpperCase()}]\n${lines.join('\n')}\n\n`
  },
})

// Highlight: <mark>text</mark> → ==text==
turndown.addRule('highlight', {
  filter: 'mark',
  replacement: (content) => `==${content}==`,
})

// Footnote ref: <sup class="footnote-ref" data-md-src="[^1]"> → [^1]
turndown.addRule('footnote-ref', {
  filter: (node) => {
    return node.nodeName === 'SUP' && (node as HTMLElement).classList.contains('footnote-ref')
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const src = el.getAttribute('data-md-src')
    if (src) return src
    // Fallback: extract from inner text
    const text = el.textContent || ''
    return text
  },
})

// TOC: .md-toc-wrapper → [TOC]
turndown.addRule('toc', {
  filter: (node) => {
    return node.nodeName === 'DIV' && (node as HTMLElement).classList.contains('md-toc-wrapper')
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const src = el.getAttribute('data-md-src')
    return src ? `\n\n${decodeURIComponent(src)}\n\n` : '\n\n[TOC]\n\n'
  },
})

// Footnotes section at the bottom → reconstruct definitions
turndown.addRule('footnotes-section', {
  filter: (node) => {
    return node.nodeName === 'DIV' && (node as HTMLElement).classList.contains('footnotes')
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const items = el.querySelectorAll('ol > li')
    if (items.length === 0) return ''
    const lines: string[] = ['']
    items.forEach((li, i) => {
      const id = li.getAttribute('id')
      const fnId = id ? `[^${id.replace('fn-', '')}]` : `[^${i + 1}]`
      // Get text content, remove the back arrow
      const text = (li.textContent || '').replace(/↩$/, '').trim()
      lines.push(`${fnId}: ${text}`)
    })
    return lines.join('\n') + '\n'
  },
})

// Styled span: keep as HTML (Obsidian compatible)
// Handles color, background-color, and font-size
// Clean up the style to only keep relevant properties
turndown.addRule('color-span', {
  filter: (node) => {
    if (node.nodeName !== 'SPAN') return false
    const el = node as HTMLElement
    const style = el.getAttribute('style') || ''
    return style.includes('color:') || style.includes('background-color:') || style.includes('font-size:')
  },
  replacement: (content, node) => {
    const el = node as HTMLElement
    // Clean up the style attribute to only keep relevant properties
    const style = el.getAttribute('style') || ''
    const cleanParts: string[] = []
    if (style.includes('color:') && !style.includes('background-color:')) {
      const match = style.match(/color:\s*([^;]+)/)
      if (match) cleanParts.push(`color: ${match[1].trim()}`)
    }
    if (style.includes('color:') && style.includes('background-color:')) {
      const colorMatch = style.match(/(?:^|;)\s*color:\s*([^;]+)/)
      if (colorMatch) cleanParts.push(`color: ${colorMatch[1].trim()}`)
    }
    if (style.includes('background-color:')) {
      const match = style.match(/background-color:\s*([^;]+)/)
      if (match) cleanParts.push(`background-color: ${match[1].trim()}`)
    }
    if (style.includes('font-size:')) {
      const match = style.match(/font-size:\s*([^;]+)/)
      if (match) cleanParts.push(`font-size: ${match[1].trim()}`)
    }
    const cleanStyle = cleanParts.join('; ')
    return cleanStyle ? `<span style="${cleanStyle}">${content}</span>` : content
  },
})

// Chromium may produce this legacy element for foreColor. Normalize it so
// documents edited by older builds also retain their color when next saved.
turndown.addRule('legacy-font-color', {
  filter: (node) => node.nodeName === 'FONT' && Boolean((node as HTMLElement).getAttribute('color')),
  replacement: (content, node) => {
    const color = (node as HTMLElement).getAttribute('color') || ''
    return `<span style="color: ${color}">${content}</span>`
  },
})

// Underline: <u>text</u> → keep as HTML tag (Obsidian compatible)
turndown.addRule('underline', {
  filter: (node) => node.nodeName === 'U',
  replacement: (_content, node) => {
    const el = node as HTMLElement
    return el.outerHTML
  },
})

// Strikethrough: GFM plugin handles <del>/<s>, but ensure ~~
turndown.addRule('strikethrough', {
  filter: ['del', 's'] as unknown as TurndownService.Filter,
  replacement: (content) => `~~${content}~~`,
})

// Remove callout-title from conversion (it's metadata, not content)
turndown.addRule('callout-title', {
  filter: (node) => {
    return node.nodeName === 'DIV' && (node as HTMLElement).classList.contains('callout-title')
  },
  replacement: () => '',
})

// Task list items: GFM plugin handles most, but ensure checkbox syntax
turndown.addRule('task-list-item', {
  filter: (node) => {
    return node.nodeName === 'LI' && (node as HTMLElement).classList.contains('task-list-item')
  },
  replacement: (content, node) => {
    const el = node as HTMLElement
    const checkbox = el.querySelector('input[type="checkbox"]')
    const checked = checkbox?.hasAttribute('checked') ? 'x' : ' '
    return `- [${checked}] ${content.trim()}\n`
  },
})

/**
 * Convert preview HTML back to Markdown.
 * Pre-processes special elements before Turndown, then cleans up output.
 */
export function htmlToMarkdown(html: string): string {
  // Pre-process: parse HTML into DOM for cleaning
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html

  // Visual paste renders Markdown for immediate display, but its original
  // plain-text source remains canonical. Protect the complete pasted fragment
  // before Turndown can escape ordered-list-like heading text (`1.` → `1\.`)
  // or otherwise rewrite tables and whitespace.
  const pastePlaceholders: string[] = []
  wrapper.querySelectorAll('[data-md-paste-source]').forEach(el => {
    const encoded = el.getAttribute('data-md-paste-source')
    if (encoded === null) return
    const placeholder = `MARKDESKPASTEPLACEHOLDER${pastePlaceholders.length}END`
    pastePlaceholders.push(decodeURIComponent(encoded))
    el.replaceWith(document.createTextNode(placeholder))
  })

  // Extract mermaid diagrams to placeholders BEFORE Turndown
  // (Turndown has issues with SVG-containing divs)
  const mermaidPlaceholders: string[] = []
  wrapper.querySelectorAll('.mermaid-diagram').forEach(el => {
    const raw = el.getAttribute('data-mermaid')
    if (raw) {
      const code = decodeURIComponent(raw)
      const placeholder = `MERMAIDPLACEHOLDER${mermaidPlaceholders.length}END`
      mermaidPlaceholders.push('\n```mermaid\n' + code + '\n```\n')
      const textNode = document.createTextNode(placeholder)
      el.replaceWith(textNode)
    }
  })

  // Extract KaTeX blocks to placeholders (avoid Turndown mangling rendered HTML)
  const katexBlockPlaceholders: string[] = []
  wrapper.querySelectorAll('.katex-block').forEach(el => {
    const src = el.getAttribute('data-md-src')
    if (src) {
      const md = decodeURIComponent(src)
      const placeholder = `KATEXBLOCKPLACEHOLDER${katexBlockPlaceholders.length}END`
      katexBlockPlaceholders.push(md)
      const textNode = document.createTextNode(placeholder)
      el.replaceWith(textNode)
    }
  })

  // Extract KaTeX inline to placeholders
  const katexInlinePlaceholders: string[] = []
  wrapper.querySelectorAll('.katex-inline').forEach(el => {
    const src = el.getAttribute('data-md-src')
    if (src) {
      const md = decodeURIComponent(src)
      const placeholder = `KATEXINLINEPLACEHOLDER${katexInlinePlaceholders.length}END`
      katexInlinePlaceholders.push(md)
      const textNode = document.createTextNode(placeholder)
      el.replaceWith(textNode)
    }
  })

  // Remove katex internal MathML (screen reader noise)
  wrapper.querySelectorAll('.katex-mathml').forEach(ml => ml.remove())

  const cleanedHtml = wrapper.innerHTML

  // Convert with Turndown
  let result = turndown.turndown(cleanedHtml)

  // Restore mermaid placeholders
  mermaidPlaceholders.forEach((md, i) => {
    result = result.replace(`MERMAIDPLACEHOLDER${i}END`, md)
  })

  // Restore katex block placeholders
  katexBlockPlaceholders.forEach((md, i) => {
    result = result.replace(`KATEXBLOCKPLACEHOLDER${i}END`, md)
  })

  // Restore katex inline placeholders
  katexInlinePlaceholders.forEach((md, i) => {
    result = result.replace(`KATEXINLINEPLACEHOLDER${i}END`, md)
  })

  // Clean up generated Markdown first, then restore pasted source last so its
  // original whitespace and escape characters remain byte-for-byte intact.
  result = result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '\n')

  pastePlaceholders.forEach((md, i) => {
    result = result.replace(`MARKDESKPASTEPLACEHOLDER${i}END`, md)
  })

  return result
}

export default turndown
