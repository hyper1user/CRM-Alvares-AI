export interface Movement {
  id: number
  personnelId: number
  orderIssuer: string | null
  orderNumber: string | null
  orderDate: string | null
  orderType: string
  positionIndex: string | null
  dailyOrderNumber: string | null
  dateFrom: string
  dateTo: string | null
  previousPosition: string | null
  isActive: boolean
  notes: string | null
  createdAt: string
}
