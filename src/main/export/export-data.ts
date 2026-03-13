/**
 * Fetch all data from DB for export, resolving lookups (id→name)
 */
import { getDatabase } from '../db/connection'
import { personnel, positions, movements, statusHistory, subdivisions } from '../db/schema'
import { eq } from 'drizzle-orm'
import { buildReverseLookupMaps, type ReverseLookupMaps } from './lookup-maps'
import { isoToDisplay } from './format-utils'

// ==================== EXPORT DATA TYPES ====================

export interface ExportPosition {
  positionIndex: string
  subdivisionCode: string
  title: string
  rankRequired: string | null
  specialtyCode: string | null
  tariffGrade: number | null
  staffNumber: string | null
  notes: string | null
}

export interface ExportPersonnel {
  ipn: string
  rankCategory: string | null
  rankName: string | null
  fullName: string
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
}

export interface ExportMovement {
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

export interface ExportStatus {
  ipn: string
  statusCode: string
  presenceGroup: string | null
  dateFrom: string
  dateTo: string | null
  comment: string | null
  isActive: boolean
  isLast: boolean
}

export interface ExportData {
  positions: ExportPosition[]
  active: ExportPersonnel[]
  excluded: ExportPersonnel[]
  movements: ExportMovement[]
  statuses: ExportStatus[]
}

// ==================== FETCH ====================

function resolvePersonnel(
  rows: (typeof personnel.$inferSelect)[],
  maps: ReverseLookupMaps
): ExportPersonnel[] {
  return rows.map((p) => ({
    ipn: p.ipn,
    rankCategory: p.rankId ? (maps.rankIdToCategory.get(p.rankId) ?? null) : null,
    rankName: p.rankId ? (maps.rankIdToName.get(p.rankId) ?? null) : null,
    fullName: p.fullName,
    callsign: p.callsign,
    dateOfBirth: isoToDisplay(p.dateOfBirth),
    phone: p.phone,
    enrollmentOrderDate: isoToDisplay(p.enrollmentOrderDate),
    enrollmentOrderInfo: p.enrollmentOrderInfo,
    arrivedFrom: p.arrivedFrom,
    arrivalPositionIdx: p.arrivalPositionIdx,
    enrollmentDate: isoToDisplay(p.enrollmentDate),
    enrollmentOrderNum: p.enrollmentOrderNum,
    currentPositionIdx: p.currentPositionIdx,
    currentSubdivision: p.currentSubdivision,
    currentStatusCode: p.currentStatusCode,
    rankOrderDate: isoToDisplay(p.rankOrderDate),
    rankOrderInfo: p.rankOrderInfo,
    serviceType: p.serviceType,
    contractDate: isoToDisplay(p.contractDate),
    contractTypeName: p.contractTypeId
      ? (maps.contractTypeIdToName.get(p.contractTypeId) ?? null)
      : null,
    idDocNumber: p.idDocNumber,
    idDocType: p.idDocType,
    birthplace: p.birthplace,
    conscriptionDate: isoToDisplay(p.conscriptionDate),
    tccName: p.tccId ? (maps.tccIdToName.get(p.tccId) ?? null) : null,
    oblast: p.oblast,
    educationLevelName: p.educationLevelId
      ? (maps.educationLevelIdToName.get(p.educationLevelId) ?? null)
      : null,
    educationInstitution: p.educationInstitution,
    educationYear: p.educationYear,
    addressActual: p.addressActual,
    maritalStatus: p.maritalStatus,
    relativesInfo: p.relativesInfo,
    gender: p.gender,
    fitness: p.fitness,
    bloodTypeName: p.bloodTypeId
      ? (maps.bloodTypeIdToName.get(p.bloodTypeId) ?? null)
      : null,
    additionalInfo: p.additionalInfo
  }))
}

export function fetchExportData(): ExportData {
  const db = getDatabase()
  const maps = buildReverseLookupMaps()

  // Positions with subdivision code
  const subCodeMap = new Map<number, string>()
  for (const s of db.select().from(subdivisions).all()) {
    subCodeMap.set(s.id, s.code)
  }

  const posRows = db.select().from(positions).all()
  const exportPositions: ExportPosition[] = posRows.map((p) => ({
    positionIndex: p.positionIndex,
    subdivisionCode: subCodeMap.get(p.subdivisionId) ?? '',
    title: p.title,
    rankRequired: p.rankRequired,
    specialtyCode: p.specialtyCode,
    tariffGrade: p.tariffGrade,
    staffNumber: p.staffNumber,
    notes: p.notes
  }))

  // Personnel
  const activeRows = db.select().from(personnel).where(eq(personnel.status, 'active')).all()
  const excludedRows = db.select().from(personnel).where(eq(personnel.status, 'excluded')).all()

  const activeExport = resolvePersonnel(activeRows, maps)
  const excludedExport = resolvePersonnel(excludedRows, maps)

  // personnelId → ipn mapping
  const idToIpn = new Map<number, string>()
  for (const p of [...activeRows, ...excludedRows]) {
    idToIpn.set(p.id, p.ipn)
  }

  // Movements
  const movRows = db.select().from(movements).all()
  const exportMovements: ExportMovement[] = movRows.map((m) => ({
    ipn: idToIpn.get(m.personnelId) ?? '',
    orderIssuer: m.orderIssuer,
    orderNumber: m.orderNumber,
    orderDate: isoToDisplay(m.orderDate),
    orderType: m.orderType,
    positionIndex: m.positionIndex,
    dailyOrderNumber: m.dailyOrderNumber,
    dateFrom: isoToDisplay(m.dateFrom) ?? m.dateFrom,
    dateTo: isoToDisplay(m.dateTo),
    previousPosition: m.previousPosition,
    isActive: m.isActive ?? true
  }))

  // Status history
  const statusRows = db.select().from(statusHistory).all()
  const exportStatuses: ExportStatus[] = statusRows.map((s) => ({
    ipn: idToIpn.get(s.personnelId) ?? '',
    statusCode: s.statusCode,
    presenceGroup: s.presenceGroup,
    dateFrom: isoToDisplay(s.dateFrom) ?? s.dateFrom,
    dateTo: isoToDisplay(s.dateTo),
    comment: s.comment,
    isActive: s.isActive ?? true,
    isLast: s.isLast ?? false
  }))

  return {
    positions: exportPositions,
    active: activeExport,
    excluded: excludedExport,
    movements: exportMovements,
    statuses: exportStatuses
  }
}
