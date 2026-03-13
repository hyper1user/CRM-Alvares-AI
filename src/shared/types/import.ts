// ==================== IMPORT TYPES ====================

/** Parsed position from EJOOS "Посади" sheet */
export interface ParsedPosition {
  positionIndex: string
  subdivisionCode: string
  title: string
  rankRequired: string | null
  specialtyCode: string | null
  tariffGrade: number | null
  staffNumber: string | null
  notes: string | null
}

/** Parsed personnel from EJOOS "ООС" / "Виключені" sheets */
export interface ParsedPersonnel {
  ipn: string
  rankCategory: string | null
  rankName: string | null
  fullName: string
  lastName: string
  firstName: string
  patronymic: string | null
  callsign: string | null
  dateOfBirth: string | null
  phone: string | null

  enrollmentOrderDate: string | null
  enrollmentOrderInfo: string | null
  arrivedFrom: string | null
  arrivalPositionIdx: string | null
  enrollmentDate: string | null
  enrollmentOrderNum: string | null

  currentPositionIdx: string | null
  currentSubdivision: string | null
  currentStatusCode: string | null

  rankOrderDate: string | null
  rankOrderInfo: string | null

  serviceType: string | null
  contractDate: string | null
  contractTypeName: string | null

  idDocNumber: string | null
  idDocType: string | null
  birthplace: string | null
  conscriptionDate: string | null
  tccName: string | null
  oblast: string | null
  educationLevelName: string | null
  educationInstitution: string | null
  educationYear: string | null
  addressActual: string | null
  maritalStatus: string | null
  relativesInfo: string | null
  gender: string | null
  fitness: string | null
  bloodTypeName: string | null
  additionalInfo: string | null

  /** 'active' or 'excluded' */
  status: string
}

/** Parsed movement from EJOOS "Переміщення" sheet */
export interface ParsedMovement {
  ipn: string
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
}

/** Parsed status from EJOOS "Статуси" sheet */
export interface ParsedStatus {
  ipn: string
  statusCode: string
  presenceGroup: string | null
  dateFrom: string
  dateTo: string | null
  comment: string | null
  isActive: boolean
  isLast: boolean
}

/** Parsed record from Data.xlsx */
export interface ParsedDataRecord {
  ipn: string
  nationality: string | null
  citizenship: string | null
  addressActual: string | null
  addressRegistered: string | null
  relativesInfo: string | null
  bloodTypeName: string | null
  militaryIdSeries: string | null
  militaryIdNumber: string | null
  passportSeries: string | null
  passportNumber: string | null
  passportIssuedBy: string | null
  passportIssuedDate: string | null
  ubdSeries: string | null
  ubdNumber: string | null
  ubdDate: string | null
}

/** Validation error/warning for a parsed row */
export interface ParseError {
  row: number
  sheet: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

/** Full parse result from EJOOS file */
export interface ParseResult {
  positions: ParsedPosition[]
  personnel: ParsedPersonnel[]
  excluded: ParsedPersonnel[]
  movements: ParsedMovement[]
  statusHistory: ParsedStatus[]
  errors: ParseError[]
  warnings: ParseError[]
  stats: {
    positionsCount: number
    personnelCount: number
    excludedCount: number
    movementsCount: number
    statusesCount: number
    errorsCount: number
    warningsCount: number
  }
}

/** Result of Data.xlsx parse */
export interface DataParseResult {
  records: ParsedDataRecord[]
  errors: ParseError[]
  stats: {
    totalRecords: number
    matchedCount: number
    unmatchedCount: number
  }
}

/** Result of import operation */
export interface ImportResult {
  success: boolean
  imported: {
    positions: number
    personnel: number
    movements: number
    statuses: number
  }
  errors: string[]
}

/** Result of data enrichment */
export interface DataImportResult {
  success: boolean
  updated: number
  skipped: number
  errors: string[]
}
