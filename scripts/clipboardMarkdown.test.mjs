import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/utils/clipboardMarkdown.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText
const clipboard = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

test('Markdown clipboard text keeps headings and tables intact', () => {
  const markdown = '## Weekly report\n\n| Metric | Value |\n| --- | --- |\n| Visits | 226 |'
  assert.equal(clipboard.selectPastedMarkdown(markdown, 'converted rich HTML'), markdown)
})

test('visual paste uses the same ordinary plain text as source paste', () => {
  assert.equal(clipboard.selectPastedMarkdown('Plain text', '**Bold text**'), 'Plain text')
})

test('HTML conversion is only used when the clipboard has no plain text', () => {
  assert.equal(clipboard.selectPastedMarkdown('', '**Bold text**'), '**Bold text**')
})

test('recognizes common inline Markdown', () => {
  assert.equal(clipboard.isLikelyMarkdown('See [MarkDesk](https://github.com/kalen2482/MarkDesk)'), true)
})

test('unwraps a multiline text clipboard envelope', () => {
  const payload = JSON.stringify({ text: '# Weekly report\n\n- Visits: 226\n- Range: 2026-08-10 ~ 2026-08-16' })
  assert.equal(clipboard.selectPastedMarkdown(payload, '<p>clipboard wrapper</p>'), '# Weekly report\n\n- Visits: 226\n- Range: 2026-08-10 ~ 2026-08-16')
})

test('unwraps escaped newlines inside a text clipboard envelope', () => {
  const payload = JSON.stringify({ text: 'First paragraph\n\nSecond paragraph\nThird line' })
  assert.equal(clipboard.selectPastedMarkdown(payload, '<p>ignored rich HTML</p>'), 'First paragraph\n\nSecond paragraph\nThird line')
})

test('keeps ordinary JSON documents unchanged', () => {
  const json = '{"text":"hello","status":"ok"}'
  assert.equal(clipboard.normalizeClipboardPlainText(json), json)
})

test('keeps a one-line JSON text value unchanged', () => {
  const json = '{"text":"hello"}'
  assert.equal(clipboard.normalizeClipboardPlainText(json), json)
})

test('normalizes real Windows line endings but preserves literal slash-n text', () => {
  assert.equal(clipboard.normalizeClipboardPlainText('one\r\ntwo\\nthree'), 'one\ntwo\\nthree')
})

test('replaces converted marker contents with exact pasted Markdown', () => {
  const converted = 'Before\n\nMARKDESKSTART\n\nconverted text\n\nMARKDESKEND\n\nAfter'
  const pasted = '## Heading\n\n| A | B |\n| --- | --- |'
  assert.equal(
    clipboard.replaceMarkedPaste(converted, 'MARKDESKSTART', 'MARKDESKEND', pasted),
    'Before\n\n## Heading\n\n| A | B |\n| --- | --- |\n\nAfter',
  )
})

test('returns null when paste markers are unavailable', () => {
  assert.equal(clipboard.replaceMarkedPaste('content', 'START', 'END', 'paste'), null)
})
