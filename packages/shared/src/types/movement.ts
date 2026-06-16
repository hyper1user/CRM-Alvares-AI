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

export interface MovementListItem extends Movement {
  fullName: string
  rankName: string | null
  ipn: string
  positionTitle: string | null
  previousPositionTitle: string | null
  subdivisionCode: string | null
  subdivisionName: string | null
}

export interface MovementFilters {
  search?: string
  subdivision?: string
  orderType?: string
  dateFrom?: string
  dateTo?: string
  isActive?: boolean
  personnelId?: number
}
