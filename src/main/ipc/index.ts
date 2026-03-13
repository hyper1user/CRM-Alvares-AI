import { ipcMain } from 'electron'
import { getDatabase } from '../db/connection'
import { IPC } from '@shared/ipc-channels'
import { ranks, statusTypes, subdivisions, bloodTypes, contractTypes, educationLevels, settings, personnel } from '../db/schema'
import { eq } from 'drizzle-orm'

export function registerIpcHandlers(): void {
  // DB Health Check
  ipcMain.handle(IPC.DB_HEALTH, () => {
    try {
      const db = getDatabase()
      const result = db.select().from(ranks).limit(1).all()
      return { ok: true, message: `БД працює. Звань: ${result.length > 0 ? 'є' : 'немає'}` }
    } catch (error) {
      return { ok: false, message: String(error) }
    }
  })

  // Settings
  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
    const db = getDatabase()
    const result = db.select().from(settings).where(eq(settings.key, key)).get()
    return result?.value ?? null
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: string) => {
    const db = getDatabase()
    db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
      .run()
    return { ok: true }
  })

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    const db = getDatabase()
    const rows = db.select().from(settings).all()
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  })

  // Personnel list (базова заглушка)
  ipcMain.handle(IPC.PERSONNEL_LIST, () => {
    const db = getDatabase()
    return db.select().from(personnel).all()
  })

  // Довідники
  ipcMain.handle(IPC.RANKS_LIST, () => {
    const db = getDatabase()
    return db.select().from(ranks).all()
  })

  ipcMain.handle(IPC.STATUS_TYPES_LIST, () => {
    const db = getDatabase()
    return db.select().from(statusTypes).all()
  })

  ipcMain.handle(IPC.SUBDIVISIONS_LIST, () => {
    const db = getDatabase()
    return db.select().from(subdivisions).all()
  })

  ipcMain.handle(IPC.BLOOD_TYPES_LIST, () => {
    const db = getDatabase()
    return db.select().from(bloodTypes).all()
  })

  ipcMain.handle(IPC.CONTRACT_TYPES_LIST, () => {
    const db = getDatabase()
    return db.select().from(contractTypes).all()
  })

  ipcMain.handle(IPC.EDUCATION_LEVELS_LIST, () => {
    const db = getDatabase()
    return db.select().from(educationLevels).all()
  })

  console.log('[ipc] Обробники зареєстровано')
}
