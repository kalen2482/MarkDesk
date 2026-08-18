import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/utils/tabSession.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText
const session = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

const starter = { id: 'starter', name: 'Untitled.md', content: '', isDirty: false }
const draft = { id: 'draft', name: 'Untitled.md', content: '', isDirty: false }

test('startup restore may replace only the original untouched tab', () => {
  assert.equal(session.shouldRestoreLastFile({
    openedFromOs: false,
    restoreAllowed: true,
    initialTabId: starter.id,
    tabs: [starter],
  }), true)
})

test('creating a new tab prevents delayed startup restore from stealing focus', () => {
  assert.equal(session.shouldRestoreLastFile({
    openedFromOs: false,
    restoreAllowed: false,
    initialTabId: starter.id,
    tabs: [starter, draft],
  }), false)
})

test('an OS-opened file takes priority over last-session restore', () => {
  assert.equal(session.shouldRestoreLastFile({
    openedFromOs: true,
    restoreAllowed: true,
    initialTabId: starter.id,
    tabs: [starter],
  }), false)
})
