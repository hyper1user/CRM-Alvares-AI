import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { is } from '@electron-toolkit/utils'

// Validate that IPC request comes from our own renderer window.
// Rejects requests from unknown origins (Electron security checklist).
function isValidSender(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url
  if (!url) return false

  // Dev: electron-vite dev server (localhost)
  if (is.dev) {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl && url.startsWith(devUrl)) return true
  }

  // Production: local file served from app bundle
  if (url.startsWith('file://')) return true

  console.warn(`[ipc] Blocked request from unexpected origin: ${url}`)
  return false
}

// Wrapper around ipcMain.handle that validates sender before executing handler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeHandle(channel: string, handler: (event: IpcMainInvokeEvent, ...args: any[]) => any): void {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isValidSender(event)) {
      return { error: 'Unauthorized IPC sender' }
    }
    return handler(event, ...args)
  })
}
