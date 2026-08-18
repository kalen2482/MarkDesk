/**
 * Helpers for pasting into the visual Markdown editor.
 *
 * Browsers expose both `text/plain` and `text/html` for a clipboard entry.
 * MarkDesk treats Markdown source as the canonical document, so visual-editor
 * paste must use the same plain-text payload as source-editor paste. Turning
 * that payload into HTML first can escape Markdown markers, preserve literal
 * `\\n` sequences, or introduce formatting that never existed in the source.
 */
export function isLikelyMarkdown(value: string): boolean {
  const text = value.replace(/\r\n?/g, '\n')
  return /(^|\n)(?:#{1,6}\s+|>\s+|[-+*]\s+|\d+\.\s+|```|\|\s*[^\n|]+\s*\|)/.test(text)
    || /(^|\n)\|?\s*:?-{3,}:?\s*\|/.test(text)
    || /!?(?:\[[^\]]+\])\([^)]+\)/.test(text)
    || /(?:\*\*|__|~~|==)[^\n]+(?:\*\*|__|~~|==)/.test(text)
}

/**
 * Normalize clipboard text and unwrap the line-oriented text envelope emitted
 * by some AI clients. The envelope is deliberately narrow: it must contain
 * only a string `text` field with at least one real line break after parsing,
 * so ordinary JSON documents remain valid source text.
 */
export function normalizeClipboardPlainText(value: string): string {
  const normalized = value.replace(/\r\n?/g, '\n')
  try {
    const parsed: unknown = JSON.parse(normalized)
    if (
      parsed
      && typeof parsed === 'object'
      && !Array.isArray(parsed)
      && Object.keys(parsed).length === 1
      && typeof (parsed as { text?: unknown }).text === 'string'
    ) {
      const text = (parsed as { text: string }).text
      if (text.includes('\n') || text.includes('\r')) return text.replace(/\r\n?/g, '\n')
    }
  } catch {
    // Not a JSON envelope; paste the original plain text.
  }
  return normalized
}

/**
 * Replace the HTML-to-Markdown result between two temporary paste markers
 * with the exact text supplied by the clipboard. This preserves the visual
 * caret position while keeping Markdown source as the canonical value.
 */
export function replaceMarkedPaste(
  convertedMarkdown: string,
  startMarker: string,
  endMarker: string,
  pastedMarkdown: string,
): string | null {
  const start = convertedMarkdown.indexOf(startMarker)
  if (start < 0) return null
  const end = convertedMarkdown.indexOf(endMarker, start + startMarker.length)
  if (end < 0) return null

  return convertedMarkdown.slice(0, start)
    + pastedMarkdown
    + convertedMarkdown.slice(end + endMarker.length)
}

/**
 * Return the Markdown representation that should be inserted into the preview.
 *
 * Prefer `text/plain` whenever it is present. This deliberately makes pasting
 * into the visual editor equivalent to pasting into the source editor. HTML is
 * only a fallback for clipboard providers that expose no plain-text variant.
 */
export function selectPastedMarkdown(plainText: string, convertedHtml: string): string {
  const normalizedPlainText = normalizeClipboardPlainText(plainText)
  return plainText.length > 0 ? normalizedPlainText : convertedHtml
}
