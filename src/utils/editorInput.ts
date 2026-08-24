/** Keep an incomplete Setext underline from restyling the preceding paragraph. */
export function protectIncompleteSetextUnderline(markdown: string): string {
  return markdown.replace(/^(\s*)(-{1,2})$/gm, '$1\\$2')
}

/** Normalize an editable draft name while preserving supported text extensions. */
export function normalizeDraftFileName(value: string): string | null {
  const trimmed = value.trim().replace(/[<>:"/\\|?*]/g, '')
  if (!trimmed) return null
  return /\.(?:md|markdown|mdx|txt)$/i.test(trimmed) ? trimmed : `${trimmed}.md`
}
