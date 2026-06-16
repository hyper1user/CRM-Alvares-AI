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

export interface PositionListItem extends Position {
  subdivisionCode: string
  subdivisionName: string
  occupantId: number | null
  occupantName: string | null
  occupantRank: string | null
}

export interface SubdivisionTreeNode extends Subdivision {
  children: SubdivisionTreeNode[]
  personnelCount: number
  positionCount: number
  vacantCount: number
}
