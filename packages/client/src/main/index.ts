import { app, shell, BrowserWindow, protocol, net } from 'electron'
import { join, resolve, normalize } from 'path'
import { appendFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from './db/connection'
import { registerIpcHandlers } from './ipc'
import { initAutoUpdater } from './updater'

// Keep userData stable after the monorepo package rename (@alvares/client).
// The historical production data lives in %APPDATA%/ejoos-plus.
app.setName('ejoos-plus')

// Fix flickering on Windows — disable GPU acceleration if problematic
app.commandLine.appendSwitch('disable-gpu-compositing')

// Register safe-file:// protocol BEFORE app ready
// Serves local files (photos, PDFs) to the renderer without exposing file:// directly
protocol.registerSchemesAsPrivileged([
  { scheme: 'safe-file', privileges: { secure: true, bypassCSP: true, supportFetchAPI: true } }
])

let mainWindow: BrowserWindow | null = null

function startupLog(message: string): void {
  try {
    appendFileSync(join(app.getPath('userData'), 'startup.log'), `${new Date().toISOString()} ${message}\n`)
  } catch {
    // Best-effort startup diagnostics only.
  }
}

function createWindow(): void {
  startupLog('createWindow:start')
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: true,
    autoHideMenuBar: true,
    title: 'АльваресAI — Облік особового складу',
    backgroundColor: '#ffffff',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  startupLog('createWindow:created')

  // Show only after DOM is fully painted to avoid white flash
  mainWindow.webContents.on('did-finish-load', () => {
    startupLog('renderer:did-finish-load')
    setTimeout(() => mainWindow.show(), 100)
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    startupLog(`renderer:did-fail-load ${errorCode} ${errorDescription} ${validatedURL}`)
    console.error('[main] renderer did-fail-load:', errorCode, errorDescription, validatedURL)
    if (!mainWindow?.isDestroyed()) mainWindow.show()
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    startupLog(`renderer:gone ${details.reason} ${details.exitCode}`)
    console.error('[main] renderer process gone:', details.reason, details.exitCode)
  })

  setTimeout(() => {
    if (!mainWindow?.isDestroyed()) mainWindow.show()
  }, 3000)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    startupLog('window:closed')
    mainWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  startupLog('createWindow:load-started')
}

app.whenReady().then(() => {
  startupLog('app:ready')
  electronApp.setAppUserModelId('com.ejoos-plus')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // safe-file:// — serve local files to renderer (photos, PDFs, docs)
  // NOTE: use safe-file:///D:/path (3 slashes) in renderer to avoid Chromium host normalization
  // Path traversal protection via resolve/normalize. No directory whitelist —
  // this is a local desktop app, files are picked by user via native dialog.
  protocol.handle('safe-file', (request) => {
    let rawPath = decodeURIComponent(request.url.slice('safe-file://'.length))
    if (rawPath.startsWith('/')) rawPath = rawPath.slice(1)

    // Resolve to absolute path (prevents path traversal like ../../etc)
    const resolvedPath = resolve(normalize(rawPath))

    const forUrl = resolvedPath.replace(/\\/g, '/')
    const encodedPath = forUrl
      .split('/')
      .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg)))
      .join('/')
    return net.fetch(`file:///${encodedPath}`)
  })

  // Реєстрація IPC обробників
  registerIpcHandlers()

  createWindow()

  // Ініціалізація БД
  startupLog('db:init:start')
  try {
    initDatabase()
    startupLog('db:init:end')
  } catch (error) {
    startupLog(`db:init:error ${error instanceof Error ? error.message : String(error)}`)
    console.error('[main] database initialization failed:', error)
  }

  // Auto-updater (only in production)
  startupLog('updater:init:start')
  initAutoUpdater()
  startupLog('updater:init:end')

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
