import { create } from 'zustand'
import dayjs from 'dayjs'

interface AppState {
  currentMonth: string // YYYY-MM
  unitName: string
  dbConnected: boolean
  sidebarCollapsed: boolean

  setCurrentMonth: (month: string) => void
  setUnitName: (name: string) => void
  setDbConnected: (connected: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentMonth: dayjs().format('YYYY-MM'),
  unitName: '12 ОШР "Хижаки"',
  dbConnected: false,
  sidebarCollapsed: false,

  setCurrentMonth: (month) => set({ currentMonth: month }),
  setUnitName: (name) => set({ unitName: name }),
  setDbConnected: (connected) => set({ dbConnected: connected }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed })
}))
