import { useState, useEffect, useCallback } from 'react'
import type { OrderListItem, OrderFilters, OrderWithItems } from '@shared/types/document'

interface UseOrderListResult {
  orders: OrderListItem[]
  loading: boolean
  refetch: () => void
}

export function useOrderList(filters: OrderFilters = {}): UseOrderListResult {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    window.api
      .ordersList(filters)
      .then((result) => setOrders(result ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [filters.search, filters.orderType, filters.dateFrom, filters.dateTo, trigger])

  return { orders, loading, refetch }
}

export function useOrderGet(id: number | null): {
  order: OrderWithItems | null
  loading: boolean
} {
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) {
      setOrder(null)
      return
    }
    setLoading(true)
    window.api
      .ordersGet(id)
      .then((result) => setOrder(result ?? null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  return { order, loading }
}
