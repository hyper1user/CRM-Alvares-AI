export interface StatusHistory {
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
}
