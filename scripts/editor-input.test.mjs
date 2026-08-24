import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/utils/editorInput.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
const { normalizeDraftFileName, protectIncompleteSetextUnderline } = await import(moduleUrl)

assert.equal(protectIncompleteSetextUnderline('正文\n--'), '正文\n\\--')
assert.equal(protectIncompleteSetextUnderline('正文\n---'), '正文\n---')
assert.equal(normalizeDraftFileName('报告'), '报告.md')
assert.equal(normalizeDraftFileName('报:告.txt'), '报告.txt')
assert.equal(normalizeDraftFileName('   '), null)

console.log('editor input regression tests passed')
