import { useState, useEffect, useCallback } from 'react'
import type { PositionListItem, SubdivisionTreeNode } from '@shared/types/position'

interface PositionFilters {
  subdivisionId?: number
  isActive?: boolean
  search?: string
  occupancy?: 'all' | 'occupied' | 'vacant' | 'deactivated'
}

interface UsePositionListResult {
  data: PositionListItem[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePositionList(filters: PositionFilters = {}): UsePositionListResult {
  const [data, setData] = useState<PositionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    window.api
      .positionsList(filters)
      .then((result: PositionListItem[]) => {
        setData(result ?? [])
      })
      .catch((err: unknown) => {
        setError(String(err))
        setData([])
      })
      .finally(() => setLoading(false))
  }, [
    filters.subdivisionId,
    filters.isActive,
    filters.search,
    filters.occupancy,
    trigger
  ])

  return { data, loading, error, refetch }
}

interface UseSubdivisionTreeResult {
  data: SubdivisionTreeNode[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSubdivisionTree(): UseSubdivisionTreeResult {
  const [data, setData] = useState<SubdivisionTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    window.api
      .subdivisionsTree()
      .then((result: SubdivisionTreeNode[]) => {
        setData(result ?? [])
      })
      .catch((err: unknown) => {
        setError(String(err))
        setData([])
      })
      .finally(() => setLoading(false))
  }, [trigger])

  return { data, loading, error, refetch }
}
