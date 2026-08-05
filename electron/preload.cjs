const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal, safe API to the renderer (contextIsolated).
// The renderer uses these only when running inside Electron; in the
// browser (dev server) `window.electronAPI` is simply undefined.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'electron',

  // Tell the main process the renderer is mounted and ready to receive files.
  notifyReady: () => ipcRenderer.send('app:ready'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window:toggleMaximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  onCloseRequested: (callback) => ipcRenderer.on('app:close-requested', callback),
  confirmClose: () => ipcRenderer.send('app:confirm-close'),

  // Subscribe to OS "open with" / file-association events.
  onFileOpen: (callback) => {
    const listener = (_event, file) => callback(file)
    ipcRenderer.on('file:opened', listener)
    return () => ipcRenderer.removeListener('file:opened', listener)
  },

  // Native open-file dialog → returns { path, content } | null
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openImageDialog: (markdownFilePath) => ipcRenderer.invoke('dialog:openImage', markdownFilePath),

  // Save content to a known path → { success, path?, error? }
  saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),

  // Native save-as dialog (writes file) → { path } | null
  saveFileAs: (defaultName, content) => ipcRenderer.invoke('dialog:saveAs', defaultName, content),
})
