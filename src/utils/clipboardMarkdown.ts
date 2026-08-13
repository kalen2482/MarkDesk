/**
 * Helpers for pasting into the visual Markdown editor.
 *
 * Browsers expose both `text/plain` and `text/html` for a clipboard entry.
 * If the plain-text variant already looks like Markdown, it must win: turning
 * it into HTML first makes Turndown escape markers such as `#` and `|`.
 */
export function isLikelyMarkdown(value: string): boolean {
  const text = value.replace(/\r\n?/g, '\n')
  return /(^|\n)(?:#{1,6}\s+|>\s+|[-+*]\s+|\d+\.\s+|```|\|\s*[^\n|]+\s*\|)/.test(text)
    || /(^|\n)\|?\s*:?-{3,}:?\s*\|/.test(text)
    || /!?(?:\[[^\]]+\])\([^)]+\)/.test(text)
    || /(?:\*\*|__|~~|==)[^\n]+(?:\*\*|__|~~|==)/.test(text)
}

/** Return the Markdown representation that should be inserted into the preview. */
export function selectPastedMarkdown(plainText: string, convertedHtml: string): string {
  const normalizedPlainText = plainText.replace(/\r\n?/g, '\n')
  return isLikelyMarkdown(normalizedPlainText) || !convertedHtml
    ? normalizedPlainText
    : convertedHtml
}
