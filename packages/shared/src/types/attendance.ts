export interface AttendanceRecord {
  id: number
  personnelId: number
  date: string
  statusCode: string
  presenceGroup: string | null
}

// Monthly attendance grid
export interface PersonnelAttendanceRow {
  personnelId: number
  fullName: string
  rankName: string | null
  subdivisionCode: string | null
  days: Record<string, string | null> // date (YYYY-MM-DD) → statusCode | null
}

export interface AttendanceMonthData {
  year: number
  month: number
  rows: PersonnelAttendanceRow[]
}

// Formation report
export interface FormationGroup {
  groupName: string
  statusCode: string
  statusName: string
  colorCode: string | null
  count: number
}

export interface FormationSubdivision {
  code: string
  name: string
  total: number
  present: number
  absent: number
}

export interface FormationReportData {
  date: string
  totalActive: number
  groups: FormationGroup[]
  bySubdivision: FormationSubdivision[]
}
