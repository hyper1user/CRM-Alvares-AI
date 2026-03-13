import { useState, useEffect, useCallback } from 'react'
import type { AttendanceMonthData } from '@shared/types/attendance'

interface UseMonthlyAttendanceResult {
  data: AttendanceMonthData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMonthlyAttendance(
  year: number,
  month: number,
  subdivision?: string
): UseMonthlyAttendanceResult {
  const [data, setData] = useState<AttendanceMonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    window.api
      .attendanceGetMonth(year, month, subdivision)
      .then((result) => {
        setData(result ?? null)
      })
      .catch((err) => {
        setError(String(err))
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [year, month, subdivision, trigger])

  return { data, loading, error, refetch }
}
