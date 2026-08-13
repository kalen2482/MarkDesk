type HighlightModule = typeof import('highlight.js')

let highlighterPromise: Promise<HighlightModule['default']> | null = null

const loadHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = import('highlight.js').then((module) => module.default)
  }
  return highlighterPromise
}

/** Lazily highlights fenced code blocks after the Markdown DOM is mounted. */
export async function highlightCodeBlocks(root: ParentNode): Promise<void> {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>('pre code[class*="language-"]:not([data-highlighted])'))
  if (blocks.length === 0) return

  const hljs = await loadHighlighter()
  for (const block of blocks) {
    if (!(root as Node).contains(block) || block.dataset.highlighted === 'true') continue
    const language = Array.from(block.classList)
      .find((name) => name.startsWith('language-'))
      ?.slice('language-'.length) || 'plaintext'
    const source = block.textContent || ''
    const result = hljs.getLanguage(language)
      ? hljs.highlight(source, { language })
      : hljs.highlight(source, { language: 'plaintext' })
    block.innerHTML = result.value
    block.classList.add('hljs')
    block.dataset.highlighted = 'true'
  }
}

export async function renderHighlightedHtml(html: string): Promise<string> {
  const container = document.createElement('div')
  container.innerHTML = html
  await highlightCodeBlocks(container)
  return container.innerHTML
}
