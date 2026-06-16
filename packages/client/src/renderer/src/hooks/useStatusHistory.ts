import { useState, useEffect, useCallback } from 'react'
import type { StatusHistoryListItem, StatusHistoryFilters } from '@shared/types/statusHistory'

interface UseStatusHistoryListResult {
  data: StatusHistoryListItem[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useStatusHistoryList(filters: StatusHistoryFilters = {}): UseStatusHistoryListResult {
  const [data, setData] = useState<StatusHistoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    window.api
      .statusHistoryList(filters)
      .then((result) => {
        setData(result ?? [])
      })
      .catch((err) => {
        setError(String(err))
        setData([])
      })
      .finally(() => setLoading(false))
  }, [
    filters.search,
    filters.statusCode,
    filters.groupName,
    filters.dateFrom,
    filters.dateTo,
    filters.personnelId,
    trigger
  ])

  return { data, loading, error, refetch }
}

interface PersonStatusHistoryItem {
  id: number
  personnelId: number
  statusCode: string
  presenceGroup: string | null
  dateFrom: string
  dateTo: string | null
  comment: string | null
  isActive: boolean
  isLast: boolean
  createdAt: string
  statusName: string
  statusColor: string | null
  groupName: string
}

interface UsePersonStatusHistoryResult {
  data: PersonStatusHistoryItem[]
  loading: boolean
  refetch: () => void
}

export function usePersonStatusHistory(personnelId: number | null): UsePersonStatusHistoryResult {
  const [data, setData] = useState<PersonStatusHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    if (!personnelId) {
      setData([])
      return
    }

    setLoading(true)

    window.api
      .statusHistoryGetByPerson(personnelId)
      .then((result) => {
        setData(result ?? [])
      })
      .catch(() => {
        setData([])
      })
      .finally(() => setLoading(false))
  }, [personnelId, trigger])

  return { data, loading, refetch }
}
