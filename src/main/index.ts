import { app, shell, BrowserWindow, protocol, net } from 'electron'
import { join, resolve, normalize } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase, getDatabase } from './db/connection'
import { settings } from './db/schema'
import { eq } from 'drizzle-orm'
import { registerIpcHandlers } from './ipc'
import { initAutoUpdater } from './updater'

// Fix flickering on Windows — disable GPU acceleration if problematic
app.commandLine.appendSwitch('disable-gpu-compositing')

// Register safe-file:// protocol BEFORE app ready
// Serves local files (photos, PDFs) to the renderer without exposing file:// directly
protocol.registerSchemesAsPrivileged([
  { scheme: 'safe-file', privileges: { secure: true, supportFetchAPI: true } }
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
      sandbox: true
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
  // Only allows files under docsRootPath and app userData directory
  protocol.handle('safe-file', (request) => {
    // Strip scheme prefix; support both safe-file:// and safe-file:///
    let rawPath = decodeURIComponent(request.url.slice('safe-file://'.length))
    // Remove leading slash (from safe-file:///D:/... → /D:/...)
    if (rawPath.startsWith('/')) rawPath = rawPath.slice(1)

    // Resolve to absolute path and check for path traversal
    const resolvedPath = resolve(normalize(rawPath))

    // Build list of allowed directories
    const allowedDirs: string[] = [app.getPath('userData')]
    try {
      const db = getDatabase()
      const row = db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'docsRootPath')).get()
      if (row?.value) allowedDirs.push(resolve(normalize(row.value)))
    } catch { /* DB not ready yet — only userData allowed */ }

    const normalizedResolved = resolvedPath.replace(/\\/g, '/').toLowerCase()
    const isAllowed = allowedDirs.some((dir) => {
      const normalizedDir = resolve(normalize(dir)).replace(/\\/g, '/').toLowerCase()
      return normalizedResolved.startsWith(normalizedDir + '/')
    })

    if (!isAllowed) {
      console.warn(`[safe-file] Blocked access to: ${resolvedPath}`)
      return new Response('Forbidden', { status: 403 })
    }

    // Normalize for file:// URL
    const forUrl = resolvedPath.replace(/\\/g, '/')
    const encodedPath = forUrl
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
