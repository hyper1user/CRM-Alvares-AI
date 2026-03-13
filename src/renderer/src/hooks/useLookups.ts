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

// Cache lookups in module scope so they're loaded only once
let cached: Omit<LookupData, 'loading'> | null = null

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
    if (fetched.current) return
    fetched.current = true

    Promise.all([
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
      setData(result)
      setLoading(false)
    })
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
