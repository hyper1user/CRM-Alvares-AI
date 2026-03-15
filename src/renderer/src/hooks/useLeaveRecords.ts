import { useState, useEffect, useCallback } from 'react'
import type { LeaveRecordListItem, LeaveRecordFilters } from '@shared/types/document'

interface UseLeaveListResult {
  records: LeaveRecordListItem[]
  loading: boolean
  refetch: () => void
}

export function useLeaveList(filters: LeaveRecordFilters = {}): UseLeaveListResult {
  const [records, setRecords] = useState<LeaveRecordListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    window.api
      .leaveList(filters)
      .then((result) => setRecords(result ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [filters.search, filters.leaveType, filters.personnelId, filters.dateFrom, filters.dateTo, trigger])

  return { records, loading, refetch }
}
