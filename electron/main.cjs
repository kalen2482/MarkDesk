const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
let mainWindow = null
let pendingFile = null
let rendererReady = false
let allowWindowClose = false
let closeRequestPending = false

// Ensure only one instance runs; additional "open with" requests are
// forwarded to the existing window (Windows / Linux).
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

function createWindow() {
  mainWindow = new BrowserWindow({
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
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    allowWindowClose = false
    closeRequestPending = false
  })

  // Keep OS close, Alt+F4, and the custom close button on the same safe path.
  mainWindow.on('close', (event) => {
    if (allowWindowClose) return
    event.preventDefault()
    if (!closeRequestPending) {
      closeRequestPending = true
      mainWindow.webContents.send('app:close-requested')
    }
  })
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
  if (mainWindow && rendererReady) {
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

ipcMain.on('app:ready', () => {
  rendererReady = true
  if (pendingFile && mainWindow) {
    mainWindow.webContents.send('file:opened', pendingFile)
    pendingFile = null
  }
})

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:toggleMaximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.on('app:confirm-close', () => {
  if (!mainWindow) return
  allowWindowClose = true
  closeRequestPending = false
  mainWindow.close()
})

ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdx', 'txt'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return readMdFile(result.filePaths[0])
})

ipcMain.handle('dialog:openBackup', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
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

ipcMain.handle('dialog:openImage', async (_event, markdownFilePath) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
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

ipcMain.handle('dialog:saveAs', async (_event, defaultName, content) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
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
