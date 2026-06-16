import { useState, useEffect, useCallback } from 'react'
import type { MovementListItem, MovementFilters, Movement } from '@shared/types/movement'

interface UseMovementListResult {
  data: MovementListItem[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMovementList(filters: MovementFilters = {}): UseMovementListResult {
  const [data, setData] = useState<MovementListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    window.api
      .movementsList(filters)
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
    filters.subdivision,
    filters.orderType,
    filters.dateFrom,
    filters.dateTo,
    filters.isActive,
    filters.personnelId,
    trigger
  ])

  return { data, loading, error, refetch }
}

interface PersonMovement extends Movement {
  positionTitle: string | null
  previousPositionTitle: string | null
}

interface UsePersonMovementsResult {
  data: PersonMovement[]
  loading: boolean
  refetch: () => void
}

export function usePersonMovements(personnelId: number | null): UsePersonMovementsResult {
  const [data, setData] = useState<PersonMovement[]>([])
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
      .movementsGetByPerson(personnelId)
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
