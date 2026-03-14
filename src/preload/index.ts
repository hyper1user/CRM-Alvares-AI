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

  // Personnel CRUD
  personnelList: (filters?: {
    search?: string
    subdivision?: string
    statusCode?: string
    category?: string
    status?: string
  }) => ipcRenderer.invoke(IPC.PERSONNEL_LIST, filters),
  personnelGet: (id: number) => ipcRenderer.invoke(IPC.PERSONNEL_GET, id),
  personnelCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.PERSONNEL_CREATE, data),
  personnelUpdate: (id: number, data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.PERSONNEL_UPDATE, id, data),
  personnelDelete: (id: number) => ipcRenderer.invoke(IPC.PERSONNEL_DELETE, id),
  personnelSearch: (query: string) => ipcRenderer.invoke(IPC.PERSONNEL_SEARCH, query),

  // Positions CRUD
  positionsList: (filters?: {
    subdivisionId?: number
    isActive?: boolean
    search?: string
    occupancy?: string
  }) => ipcRenderer.invoke(IPC.POSITIONS_LIST, filters),
  positionsGet: (id: number) => ipcRenderer.invoke(IPC.POSITIONS_GET, id),
  positionsCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.POSITIONS_CREATE, data),
  positionsUpdate: (id: number, data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.POSITIONS_UPDATE, id, data),

  // Subdivisions
  subdivisionsList: () => ipcRenderer.invoke(IPC.SUBDIVISIONS_LIST),
  subdivisionsTree: () => ipcRenderer.invoke(IPC.SUBDIVISIONS_TREE),
  subdivisionsUpdate: (id: number, data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SUBDIVISIONS_UPDATE, id, data),

  // Lookups
  ranksList: () => ipcRenderer.invoke(IPC.RANKS_LIST),
  statusTypesList: () => ipcRenderer.invoke(IPC.STATUS_TYPES_LIST),
  bloodTypesList: () => ipcRenderer.invoke(IPC.BLOOD_TYPES_LIST),
  contractTypesList: () => ipcRenderer.invoke(IPC.CONTRACT_TYPES_LIST),
  educationLevelsList: () => ipcRenderer.invoke(IPC.EDUCATION_LEVELS_LIST),

  // Movements
  movementsList: (filters?: {
    search?: string
    subdivision?: string
    orderType?: string
    dateFrom?: string
    dateTo?: string
    isActive?: boolean
    personnelId?: number
  }) => ipcRenderer.invoke(IPC.MOVEMENTS_LIST, filters),
  movementsCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.MOVEMENTS_CREATE, data),
  movementsGetByPerson: (personnelId: number) =>
    ipcRenderer.invoke(IPC.MOVEMENTS_GET_BY_PERSON, personnelId),

  // Status History
  statusHistoryList: (filters?: {
    search?: string
    statusCode?: string
    groupName?: string
    subdivision?: string
    dateFrom?: string
    dateTo?: string
    personnelId?: number
  }) => ipcRenderer.invoke(IPC.STATUS_HISTORY_LIST, filters),
  statusHistoryCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.STATUS_HISTORY_CREATE, data),
  statusHistoryGetByPerson: (personnelId: number) =>
    ipcRenderer.invoke(IPC.STATUS_HISTORY_GET_BY_PERSON, personnelId),

  // Attendance
  attendanceGetMonth: (year: number, month: number, subdivisionCode?: string) =>
    ipcRenderer.invoke(IPC.ATTENDANCE_GET_MONTH, year, month, subdivisionCode),
  attendanceSetDay: (personnelId: number, date: string, statusCode: string) =>
    ipcRenderer.invoke(IPC.ATTENDANCE_SET_DAY, personnelId, date, statusCode),
  attendanceSnapshot: (date: string) => ipcRenderer.invoke(IPC.ATTENDANCE_SNAPSHOT, date),

  // Import
  openFileDialog: (filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke(IPC.OPEN_FILE_DIALOG, filters),
  importEjoosPreview: (filePath: string) => ipcRenderer.invoke(IPC.IMPORT_EJOOS_PREVIEW, filePath),
  importEjoosConfirm: (filePath: string) => ipcRenderer.invoke(IPC.IMPORT_EJOOS_CONFIRM, filePath),
  importData: (filePath: string) => ipcRenderer.invoke(IPC.IMPORT_DATA, filePath),

  // Export
  exportEjoos: () => ipcRenderer.invoke(IPC.EXPORT_EJOOS),
  exportCsv: () => ipcRenderer.invoke(IPC.EXPORT_CSV),

  // Documents
  templatesList: () => ipcRenderer.invoke(IPC.TEMPLATES_LIST),
  templatesGetTags: (templateId: number) =>
    ipcRenderer.invoke(IPC.TEMPLATES_GET_TAGS, templateId),
  documentsGenerate: (data: {
    templateId: number
    title: string
    personnelIds?: number[]
    fields: Record<string, string>
  }) => ipcRenderer.invoke(IPC.DOCUMENTS_GENERATE, data),
  documentsList: (filters?: { documentType?: string; search?: string }) =>
    ipcRenderer.invoke(IPC.DOCUMENTS_LIST, filters),
  documentsOpen: (filePath: string) => ipcRenderer.invoke(IPC.DOCUMENTS_OPEN, filePath),
  documentsDelete: (id: number) => ipcRenderer.invoke(IPC.DOCUMENTS_DELETE, id),

  // Statistics
  statisticsSummary: (subdivision?: string) => ipcRenderer.invoke(IPC.STATISTICS_SUMMARY, subdivision),
  statisticsByStatus: (subdivision?: string) => ipcRenderer.invoke(IPC.STATISTICS_BY_STATUS, subdivision),
  statisticsBySubdivision: (subdivision?: string) => ipcRenderer.invoke(IPC.STATISTICS_BY_SUBDIVISION, subdivision)
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
