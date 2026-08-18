import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const main = fs.readFileSync(new URL('../electron/main.cjs', import.meta.url), 'utf8')
const preload = fs.readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('canceling the close dialog clears the main-process pending-close guard', () => {
  assert.match(main, /ipcMain\.on\('app:cancel-close',[\s\S]*?closeRequestPending = false/)
  assert.match(preload, /cancelClose: \(\) => ipcRenderer\.send\('app:cancel-close'\)/)
  assert.match(app, /window\.electronAPI\?\.cancelClose\(\)/)
})
