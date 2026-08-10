import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/utils/backup.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText
const backup = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

test('backup round trip keeps content and settings', () => {
  const created = backup.createBackup('notes.md', '# Notes', { fontSize: 16 })
  const restored = backup.parseBackup(JSON.stringify(created))
  assert.equal(restored.name, 'notes.md')
  assert.equal(restored.content, '# Notes')
  assert.deepEqual(restored.settings, { fontSize: 16 })
})

test('backup parser rejects unsupported input', () => {
  assert.throws(() => backup.parseBackup('{"format":"other"}'))
  assert.throws(() => backup.parseBackup('not json'))
})
