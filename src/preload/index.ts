import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '../shared/ipc-channels'

const api = {
  // DB
  dbHealth: () => ipcRenderer.invoke(IPC.DB_HEALTH),

  // Settings
  settingsGet: (key: string) => ipcRenderer.invoke(IPC.SETTINGS_GET, key),
  settingsSet: (key: string, value: string) => ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
  settingsGetAll: () => ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),

  // Personnel
  personnelList: () => ipcRenderer.invoke(IPC.PERSONNEL_LIST),

  // Lookups
  ranksList: () => ipcRenderer.invoke(IPC.RANKS_LIST),
  statusTypesList: () => ipcRenderer.invoke(IPC.STATUS_TYPES_LIST),
  subdivisionsList: () => ipcRenderer.invoke(IPC.SUBDIVISIONS_LIST),
  bloodTypesList: () => ipcRenderer.invoke(IPC.BLOOD_TYPES_LIST),
  contractTypesList: () => ipcRenderer.invoke(IPC.CONTRACT_TYPES_LIST),
  educationLevelsList: () => ipcRenderer.invoke(IPC.EDUCATION_LEVELS_LIST)
}

export type ApiType = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
