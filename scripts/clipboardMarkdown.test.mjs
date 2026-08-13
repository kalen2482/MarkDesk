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

test('rich clipboard conversion is used for ordinary plain text', () => {
  assert.equal(clipboard.selectPastedMarkdown('Plain text', '**Bold text**'), '**Bold text**')
})

test('recognizes common inline Markdown', () => {
  assert.equal(clipboard.isLikelyMarkdown('See [MarkDesk](https://github.com/kalen2482/MarkDesk)'), true)
})
