import { useState, useEffect, useRef } from 'react'

interface Rank {
  id: number
  name: string
  category: string
  sortOrder: number
  natoCode: string | null
}

interface StatusType {
  id: number
  code: string
  name: string
  groupName: string
  onSupply: boolean | null
  isCombat?: boolean | null
  // v1.4.0: відповідник у DGV-семантиці (з DGV_CODES) для генерації
  // ДГВ-рапорту з attendance замість окремого dgv_marks.
  dgvCode?: string | null
  sortOrder: number
  colorCode: string | null
}

interface Subdivision {
  id: number
  code: string
  name: string
  fullName: string | null
  parentId: number | null
  sortOrder: number
}

interface BloodType {
  id: number
  name: string
}

interface ContractType {
  id: number
  name: string
  months: number
  toDemob: boolean | null
}

interface EducationLevel {
  id: number
  name: string
}

interface Position {
  id: number
  positionIndex: string
  subdivisionId: number
  title: string
  detail: string | null
  fullTitle: string | null
  rankRequired: string | null
  isActive: boolean | null
}

interface LookupData {
  ranks: Rank[]
  statusTypes: StatusType[]
  subdivisions: Subdivision[]
  bloodTypes: BloodType[]
  contractTypes: ContractType[]
  educationLevels: EducationLevel[]
  positions: Position[]
  loading: boolean
}

// v1.2.1: pub/sub з invalidate для CRUD на довідниках. Без нього cache
// зберігає stale-дані після правки в адмінці — donut/Канбан/Реєстр не бачать
// нових кольорів/категорій, поки не перезапустити додаток.
let cached: Omit<LookupData, 'loading'> | null = null
const subscribers = new Set<(d: Omit<LookupData, 'loading'>) => void>()
let inFlight: Promise<Omit<LookupData, 'loading'>> | null = null

async function fetchLookups(): Promise<Omit<LookupData, 'loading'>> {
  if (inFlight) return inFlight
  inFlight = Promise.all([
    window.api.ranksList(),
    window.api.statusTypesList(),
    window.api.subdivisionsList(),
    window.api.bloodTypesList(),
    window.api.contractTypesList(),
    window.api.educationLevelsList(),
    window.api.positionsList({})
  ]).then(([ranks, statusTypes, subdivisions, bloodTypes, contractTypes, educationLevels, positions]) => {
    const result = { ranks, statusTypes, subdivisions, bloodTypes, contractTypes, educationLevels, positions }
    cached = result
    inFlight = null
    return result
  })
  return inFlight
}

/**
 * Скинути lookups-cache і ре-фетчити. Викликати ПІСЛЯ CRUD-операцій
 * у довідниках (status_types, subdivisions, ranks, etc.) — щоб усі
 * компоненти, що підписані через useLookups, отримали свіжі дані.
 */
export async function invalidateLookups(): Promise<void> {
  cached = null
  inFlight = null
  const fresh = await fetchLookups()
  subscribers.forEach((fn) => fn(fresh))
}

export function useLookups(): LookupData {
  const [data, setData] = useState<Omit<LookupData, 'loading'>>(
    cached ?? {
      ranks: [],
      statusTypes: [],
      subdivisions: [],
      bloodTypes: [],
      contractTypes: [],
      educationLevels: [],
      positions: []
    }
  )
  const [loading, setLoading] = useState(!cached)
  const fetched = useRef(!!cached)

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true
      fetchLookups().then((result) => {
        setData(result)
        setLoading(false)
      })
    }
    // Підписуємося на invalidate — щоб після правки з адмінки оновитись.
    const subscriber = (fresh: Omit<LookupData, 'loading'>): void => {
      setData(fresh)
      setLoading(false)
    }
    subscribers.add(subscriber)
    return () => {
      subscribers.delete(subscriber)
    }
  }, [])

  return { ...data, loading }
}

// Helper: get status color by code
export function useStatusColor(): (code: string | null | undefined) => string | undefined {
  const { statusTypes } = useLookups()
  return (code) => {
    if (!code) return undefined
    return statusTypes.find((s) => s.code === code)?.colorCode ?? undefined
  }
}
