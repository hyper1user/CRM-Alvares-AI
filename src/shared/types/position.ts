export interface Position {
  id: number
  positionIndex: string
  subdivisionId: number
  title: string
  detail: string | null
  fullTitle: string | null
  rankRequired: string | null
  specialtyCode: string | null
  tariffGrade: number | null
  staffNumber: string | null
  isActive: boolean
  notes: string | null
}

export interface Subdivision {
  id: number
  code: string
  name: string
  fullName: string | null
  parentId: number | null
  sortOrder: number
  isActive: boolean
}
