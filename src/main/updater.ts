import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'

export function initAutoUpdater(): void {
  // Don't check for updates in dev mode
  if (process.env.NODE_ENV === 'development') return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Security: only use HTTPS
  autoUpdater.forceDevUpdateConfig = false

  autoUpdater.on('update-available', (info) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return

    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'Оновлення доступне',
        message: `Доступна нова версія ${info.version}.\nВстановити зараз?`,
        buttons: ['Оновити', 'Пізніше'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-downloaded', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return

    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'Оновлення завантажено',
        message: 'Оновлення завантажено. Додаток перезапуститься для встановлення.',
        buttons: ['Перезапустити', 'Пізніше']
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] Error:', err.message)
  })

  // Check for updates 5 seconds after app start
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] Check failed:', err.message)
    })
  }, 5000)
}
