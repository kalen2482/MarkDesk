const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { autoUpdater } = require('electron-updater')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
let mainWindow = null
let pendingFile = null
const readyWindows = new WeakSet()
const closeStates = new WeakMap()
const initialTabs = new Map()
let updatePromptedVersion = null
let updateCheckRunning = false
let manualUpdateCheck = false

// Ensure only one instance runs; additional "open with" requests are
// forwarded to the existing window (Windows / Linux).
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

function createWindow(initialTab = null) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'MarkDesk',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    frame: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow = win
  closeStates.set(win, { allow: false, pending: false })
  if (initialTab) initialTabs.set(win.webContents.id, initialTab)

  win.on('focus', () => { mainWindow = win })
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = BrowserWindow.getAllWindows()[0] || null
  })

  // Keep OS close, Alt+F4, and the custom close button on the same safe path.
  win.on('close', (event) => {
    const state = closeStates.get(win) || { allow: false, pending: false }
    if (state.allow) return
    event.preventDefault()
    if (!state.pending) {
      state.pending = true
      closeStates.set(win, state)
      win.webContents.send('app:close-requested')
    }
  })
  return win
}

function readMdFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { path: filePath, content }
  } catch (err) {
    console.error('Failed to read file:', filePath, err)
    return null
  }
}

// A .md file passed as a command-line argument (Windows "Open with").
function fileFromArgv(argv) {
  const fileArg = argv.find((a) => /\.(md|markdown|mdx)$/i.test(a))
  if (!fileArg) return null
  return readMdFile(path.resolve(fileArg))
}

// Send a file to the renderer if ready, otherwise queue it.
function sendFile(file) {
  if (!file) return
  if (mainWindow && readyWindows.has(mainWindow)) {
    mainWindow.webContents.send('file:opened', file)
  } else {
    pendingFile = file
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  pendingFile = fileFromArgv(process.argv)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// macOS: open via Finder / "Open with".
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  sendFile(readMdFile(filePath))
})

// Windows / Linux: a second instance was launched (user opened another .md).
app.on('second-instance', (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
  sendFile(fileFromArgv(argv))
})

// ── IPC handlers ──

ipcMain.on('app:ready', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) readyWindows.add(win)
  const initialTab = initialTabs.get(event.sender.id)
  if (initialTab && win) {
    win.webContents.send('tab:detached', initialTab)
    initialTabs.delete(event.sender.id)
  }
  if (pendingFile && win) {
    win.webContents.send('file:opened', pendingFile)
    pendingFile = null
  }
})

ipcMain.on('window:minimize', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize())
ipcMain.on('window:toggleMaximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  if (win.isMaximized()) win.unmaximize()
  else win.maximize()
})
ipcMain.on('window:close', (event) => BrowserWindow.fromWebContents(event.sender)?.close())
ipcMain.on('app:cancel-close', (event) => {
  // The renderer dismissed its save-confirmation dialog. Permit the next OS
  // close request to notify it again instead of leaving the window stuck in a
  // pending-close state.
  const win = BrowserWindow.fromWebContents(event.sender)
  const state = win && closeStates.get(win)
  if (state) state.pending = false
})
ipcMain.on('app:confirm-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  const state = closeStates.get(win) || { allow: false, pending: false }
  state.allow = true
  state.pending = false
  closeStates.set(win, state)
  win.close()
})

ipcMain.handle('tab:detach', async (event, tab, screenPoint) => {
  const source = BrowserWindow.fromWebContents(event.sender)
  if (!source || !tab || typeof tab.id !== 'string') return false
  const bounds = source.getBounds()
  const outside = !screenPoint || screenPoint.x < bounds.x || screenPoint.x > bounds.x + bounds.width || screenPoint.y < bounds.y || screenPoint.y > bounds.y + bounds.height
  if (!outside) return false
  const win = createWindow(tab)
  if (screenPoint && Number.isFinite(screenPoint.x) && Number.isFinite(screenPoint.y)) {
    win.setPosition(Math.max(0, Math.round(screenPoint.x - 300)), Math.max(0, Math.round(screenPoint.y - 30)))
  }
  win.show()
  win.focus()
  return true
})

ipcMain.handle('dialog:openFile', async (event) => {
  const owner = BrowserWindow.fromWebContents(event.sender) || mainWindow
  if (!owner) return null
  const result = await dialog.showOpenDialog(owner, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdx', 'txt'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return readMdFile(result.filePaths[0])
})

ipcMain.handle('dialog:openBackup', async (event) => {
  const owner = BrowserWindow.fromWebContents(event.sender) || mainWindow
  if (!owner) return null
  const result = await dialog.showOpenDialog(owner, {
    properties: ['openFile'],
    filters: [{ name: 'MarkDesk backup', extensions: ['json'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  try {
    return { path: result.filePaths[0], content: fs.readFileSync(result.filePaths[0], 'utf-8') }
  } catch (err) {
    return { error: String(err) }
  }
})

// Open a previously used Markdown file without showing the native picker.
// Keep the extension check in the main process as the security boundary.
ipcMain.handle('file:openRecent', async (_event, filePath) => {
  if (typeof filePath !== 'string' || !/\.(md|markdown|mdx|txt)$/i.test(filePath)) return null
  return readMdFile(filePath)
})

ipcMain.handle('dialog:openImage', async (event, markdownFilePath) => {
  const owner = BrowserWindow.fromWebContents(event.sender) || mainWindow
  if (!owner) return null
  const result = await dialog.showOpenDialog(owner, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const imagePath = result.filePaths[0]
  const extension = path.extname(imagePath).slice(1).toLowerCase()
  const mime = ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp' })[extension] || 'application/octet-stream'
  const dataUrl = `data:${mime};base64,${fs.readFileSync(imagePath).toString('base64')}`
  return { path: imagePath, markdownPath: dataUrl }
})

ipcMain.handle('file:save', async (_event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true, path: filePath }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('dialog:saveAs', async (event, defaultName, content) => {
  const owner = BrowserWindow.fromWebContents(event.sender) || mainWindow
  if (!owner) return null
  const result = await dialog.showSaveDialog(owner, {
    defaultPath: defaultName || 'untitled.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  })
  if (result.canceled || !result.filePath) return null
  try {
    fs.writeFileSync(result.filePath, content, 'utf-8')
    return { path: result.filePath }
  } catch (err) {
    console.error('Save-as failed:', err)
    return { error: String(err) }
  }
})

ipcMain.handle('dialog:exportPDF', async (event, defaultName, html) => {
  const owner = BrowserWindow.fromWebContents(event.sender) || mainWindow
  if (!owner) return null
  if (typeof html !== 'string' || typeof defaultName !== 'string') {
    return { error: 'Invalid PDF export data.' }
  }

  const result = await dialog.showSaveDialog(owner, {
    defaultPath: defaultName || 'untitled.pdf',
    filters: [{ name: 'PDF document', extensions: ['pdf'] }],
  })
  if (result.canceled || !result.filePath) return null

  let pdfWindow = null
  const temporaryHtmlPath = path.join(app.getPath('temp'), `markdesk-pdf-${process.pid}-${Date.now()}.html`)
  try {
    fs.writeFileSync(temporaryHtmlPath, html, 'utf-8')
    pdfWindow = new BrowserWindow({
      show: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    })
    await pdfWindow.loadFile(temporaryHtmlPath)
    await pdfWindow.webContents.executeJavaScript('document.fonts ? document.fonts.ready.then(() => true) : true')
    const pdf = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      preferCSSPageSize: true,
    })
    fs.writeFileSync(result.filePath, pdf)
    return { path: result.filePath }
  } catch (err) {
    console.error('PDF export failed:', err)
    return { error: String(err) }
  } finally {
    if (pdfWindow && !pdfWindow.isDestroyed()) pdfWindow.destroy()
    try { fs.unlinkSync(temporaryHtmlPath) } catch {}
  }
})

const updatePreferencesPath = () => path.join(app.getPath('userData'), 'update-preferences.json')
const readUpdatePreferences = () => {
  try { return JSON.parse(fs.readFileSync(updatePreferencesPath(), 'utf-8')) }
  catch { return { autoCheck: true, skippedVersion: null } }
}
const writeUpdatePreferences = (next) => fs.writeFileSync(updatePreferencesPath(), JSON.stringify(next, null, 2), 'utf-8')

async function checkForUpdates(manual = false, ownerWindow = mainWindow) {
  if (isDev || updateCheckRunning) return
  updateCheckRunning = true
  manualUpdateCheck = manual
  try {
    const result = await autoUpdater.checkForUpdates()
    if (!result?.updateInfo || result.updateInfo.version === app.getVersion()) {
      if (manual && ownerWindow) await dialog.showMessageBox(ownerWindow, { type: 'info', title: '检查更新', message: '当前已是最新版本。' })
    }
  } catch (error) {
    console.error('Update check failed:', error)
    if (manual && ownerWindow) await dialog.showMessageBox(ownerWindow, { type: 'warning', title: '检查更新', message: '暂时无法检查更新，请稍后重试。' })
  } finally {
    updateCheckRunning = false
    manualUpdateCheck = false
  }
}

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.on('update-available', async (info) => {
  const preferences = readUpdatePreferences()
  if (!mainWindow) return
  if (!manualUpdateCheck && (preferences.skippedVersion === info.version || updatePromptedVersion === info.version)) return
  updatePromptedVersion = info.version
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: '发现新版本',
    message: `发现 MarkDesk ${info.version}`,
    detail: `当前版本：${app.getVersion()}\n可以从 GitHub 下载并自动安装新版本。`,
    buttons: ['立即更新', '稍后提醒', '不再提醒此版本'],
    defaultId: 0,
    cancelId: 1,
  })
  if (response === 2) {
    writeUpdatePreferences({ ...preferences, skippedVersion: info.version })
  } else if (response === 0) {
    try { await autoUpdater.downloadUpdate() }
    catch (error) { await dialog.showMessageBox(mainWindow, { type: 'error', title: '更新失败', message: '更新下载失败，请稍后重试或前往 GitHub 手动下载。' }) }
  }
})
autoUpdater.on('update-downloaded', async (info) => {
  if (!mainWindow) return
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info', title: '更新已下载', message: `MarkDesk ${info.version} 已准备就绪。`,
    detail: '立即重启以完成安装，或关闭 MarkDesk 时自动安装。',
    buttons: ['立即重启安装', '稍后安装'], defaultId: 0, cancelId: 1,
  })
  if (response === 0) autoUpdater.quitAndInstall(false, true)
})

ipcMain.on('updates:configure', (event, enabled) => {
  const preferences = readUpdatePreferences()
  writeUpdatePreferences({ ...preferences, autoCheck: Boolean(enabled) })
  if (enabled) setTimeout(() => checkForUpdates(false, BrowserWindow.fromWebContents(event.sender)), 4000)
})
ipcMain.handle('updates:check', (event) => checkForUpdates(true, BrowserWindow.fromWebContents(event.sender)))
