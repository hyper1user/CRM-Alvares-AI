import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app.store'

// --- Types ---

export interface StatisticsSummary {
  totalPersonnel: number
  excludedPersonnel: number
  onSupplyCount: number
  offSupplyCount: number
  byGroup: { groupName: string; count: number; color: string | null }[]
  byCategory: { category: string; count: number }[]
  totalPositions: number
  vacantPositions: number
}

export interface StatusStatItem {
  statusCode: string
  statusName: string
  groupName: string
  color: string
  count: number
}

export interface SubdivisionStatItem {
  subdivisionCode: string
  subdivisionName: string
  total: number
  onSupply: number
  offSupply: number
}

// --- Hooks ---

const emptySummary: StatisticsSummary = {
  totalPersonnel: 0,
  excludedPersonnel: 0,
  onSupplyCount: 0,
  offSupplyCount: 0,
  byGroup: [],
  byCategory: [],
  totalPositions: 0,
  vacantPositions: 0
}

export function useStatisticsSummary() {
  const [data, setData] = useState<StatisticsSummary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [trigger, setTrigger] = useState(0)
  const globalSubdivision = useAppStore((s) => s.globalSubdivision)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    window.api
      .statisticsSummary(globalSubdivision)
      .then((result: StatisticsSummary) => setData(result ?? emptySummary))
      .catch(() => setData(emptySummary))
      .finally(() => setLoading(false))
  }, [trigger, globalSubdivision])

  return { data, loading, refetch }
}

export function useStatisticsByStatus() {
  const [data, setData] = useState<StatusStatItem[]>([])
  const [loading, setLoading] = useState(true)
  const globalSubdivision = useAppStore((s) => s.globalSubdivision)

  useEffect(() => {
    setLoading(true)
    window.api
      .statisticsByStatus(globalSubdivision)
      .then((result: StatusStatItem[]) => setData(result ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [globalSubdivision])

  return { data, loading }
}

export function useStatisticsBySubdivision() {
  const [data, setData] = useState<SubdivisionStatItem[]>([])
  const [loading, setLoading] = useState(true)
  const globalSubdivision = useAppStore((s) => s.globalSubdivision)

  useEffect(() => {
    setLoading(true)
    window.api
      .statisticsBySubdivision(globalSubdivision)
      .then((result: SubdivisionStatItem[]) => setData(result ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [globalSubdivision])

  return { data, loading }
}
