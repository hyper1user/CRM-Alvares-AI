import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import { safeHandle } from './ipc/safe-handle'

export type UpdaterStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up-to-date'; currentVersion: string }
  | { state: 'available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

let currentStatus: UpdaterStatus = { state: 'idle' }

function broadcast(status: UpdaterStatus): void {
  currentStatus = status
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('updater:status', status)
  }
}

export function getUpdaterStatus(): UpdaterStatus {
  return currentStatus
}

export function initAutoUpdater(): void {
  if (process.env.NODE_ENV === 'development') return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.forceDevUpdateConfig = false

  autoUpdater.on('checking-for-update', () => {
    broadcast({ state: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    broadcast({ state: 'available', version: info.version })

    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'Оновлення доступне',
        message: `Доступна нова версія ${info.version}.\nЗавантажити зараз?`,
        buttons: ['Завантажити', 'Пізніше'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
          broadcast({ state: 'downloading', percent: 0 })
        }
      })
  })

  autoUpdater.on('update-not-available', (info) => {
    broadcast({ state: 'up-to-date', currentVersion: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    broadcast({ state: 'downloading', percent: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    broadcast({ state: 'downloaded', version: info.version })

    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'Оновлення завантажено',
        message: `Версія ${info.version} завантажена. Перезапустити зараз?`,
        buttons: ['Перезапустити', 'Пізніше']
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.on('error', (err) => {
    const msg = err.message ?? String(err)
    console.error('[updater] Error:', msg)
    broadcast({ state: 'error', message: msg })
  })

  // IPC: manual check from renderer
  safeHandle('updater:check', async () => {
    try {
      broadcast({ state: 'checking' })
      await autoUpdater.checkForUpdates()
    } catch (err) {
      const msg = String(err)
      broadcast({ state: 'error', message: msg })
    }
  })

  // IPC: get current status
  safeHandle('updater:get-status', () => currentStatus)

  // IPC: install downloaded update
  safeHandle('updater:install', () => {
    autoUpdater.quitAndInstall()
  })

  // Auto-check 5s after start
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      broadcast({ state: 'error', message: String(err) })
    })
  }, 5000)
}
