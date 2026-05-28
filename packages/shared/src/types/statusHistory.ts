export interface StatusHistoryItem {
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

export interface StatusHistoryListItem extends StatusHistoryItem {
  fullName: string
  rankName: string | null
  ipn: string
  statusName: string
  statusColor: string | null
  groupName: string
}

export interface StatusHistoryFilters {
  search?: string
  statusCode?: string
  groupName?: string
  subdivision?: string
  dateFrom?: string
  dateTo?: string
  personnelId?: number
}
