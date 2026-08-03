const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
let mainWindow = null
let pendingFile = null
let rendererReady = false

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

ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdx', 'txt'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return readMdFile(result.filePaths[0])
})

ipcMain.handle('dialog:openImage', async (_event, markdownFilePath) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const imagePath = result.filePaths[0]
  const markdownPath = markdownFilePath
    ? path.relative(path.dirname(markdownFilePath), imagePath).split(path.sep).join('/')
    : imagePath
  return { path: imagePath, markdownPath }
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
    return null
  }
})
