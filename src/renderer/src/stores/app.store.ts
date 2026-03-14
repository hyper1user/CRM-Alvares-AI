import { create } from 'zustand'
import dayjs from 'dayjs'

const SUBDIVISION_KEY = 'ejoos-global-subdivision'

interface AppState {
  currentMonth: string // YYYY-MM
  unitName: string
  dbConnected: boolean
  sidebarCollapsed: boolean
  globalSubdivision: string | undefined // subdivision code or undefined = all

  setCurrentMonth: (month: string) => void
  setUnitName: (name: string) => void
  setDbConnected: (connected: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setGlobalSubdivision: (code: string | undefined) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentMonth: dayjs().format('YYYY-MM'),
  unitName: '12 ОШР "Хижаки"',
  dbConnected: false,
  sidebarCollapsed: false,
  globalSubdivision: localStorage.getItem(SUBDIVISION_KEY) || undefined,

  setCurrentMonth: (month) => set({ currentMonth: month }),
  setUnitName: (name) => set({ unitName: name }),
  setDbConnected: (connected) => set({ dbConnected: connected }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setGlobalSubdivision: (code) => {
    if (code) {
      localStorage.setItem(SUBDIVISION_KEY, code)
    } else {
      localStorage.removeItem(SUBDIVISION_KEY)
    }
    set({ globalSubdivision: code })
  }
}))
