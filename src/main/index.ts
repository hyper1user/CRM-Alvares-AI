import { app, shell, BrowserWindow, protocol, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from './db/connection'
import { registerIpcHandlers } from './ipc'
import { initAutoUpdater } from './updater'

// Fix flickering on Windows — disable GPU acceleration if problematic
app.commandLine.appendSwitch('disable-gpu-compositing')

// Register safe-file:// protocol BEFORE app ready
// Serves local files (photos, PDFs) to the renderer without exposing file:// directly
protocol.registerSchemesAsPrivileged([
  { scheme: 'safe-file', privileges: { secure: true, bypassCSP: true, supportFetchAPI: true } }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    title: 'АльваресAI — Облік особового складу',
    backgroundColor: '#ffffff',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Show only after DOM is fully painted to avoid white flash
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => mainWindow.show(), 100)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.ejoos-plus')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // safe-file:// — serve local files to renderer (photos, PDFs)
  // NOTE: use safe-file:///D:/path (3 slashes) in renderer to avoid Chromium host normalization
  protocol.handle('safe-file', (request) => {
    // Strip scheme prefix; support both safe-file:// and safe-file:///
    let rawPath = decodeURIComponent(request.url.slice('safe-file://'.length))
    // Remove leading slash (from safe-file:///D:/... → /D:/...)
    if (rawPath.startsWith('/')) rawPath = rawPath.slice(1)
    // Normalize backslashes
    const normalized = rawPath.replace(/\\/g, '/')
    // Re-encode each segment so file:// URL is valid (handles Cyrillic, spaces)
    const encodedPath = normalized
      .split('/')
      .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg)))
      .join('/')
    return net.fetch(`file:///${encodedPath}`)
  })

  // Ініціалізація БД
  initDatabase()

  // Реєстрація IPC обробників
  registerIpcHandlers()

  createWindow()

  // Auto-updater (only in production)
  initAutoUpdater()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
