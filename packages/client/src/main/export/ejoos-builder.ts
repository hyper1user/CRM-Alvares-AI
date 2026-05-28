/**
 * Build ExcelJS Workbook with 5 sheets matching EJOOS format
 * Sheets: тПосади, ООС, Виключені, тПереміщення, тСтатусиІсторія
 */
import ExcelJS from 'exceljs'
import type { ExportData, ExportPersonnel, ExportMovement, ExportStatus } from './export-data'

// ==================== HEADER STYLES ====================

function applyHeaderStyle(
  row: ExcelJS.Row,
  bgColor: string,
  colCount: number
): void {
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c)
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor }
    }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
    cell.alignment = { wrapText: true, vertical: 'middle' }
  }
}

// ==================== POSITIONS SHEET ====================

const POSITION_HEADERS = [
  'Індекс посади',         // 0
  '',                       // 1
  'Код підрозділу',        // 2
  '',                       // 3
  'Назва посади',          // 4
  'Звання',                // 5
  'ВОС',                   // 6
  'Тарифний розряд',      // 7
  '',                       // 8
  'Штатний номер',         // 9
  '',                       // 10
  '',                       // 11
  'Примітки'               // 12
]

function addPositionsSheet(wb: ExcelJS.Workbook, data: ExportData): void {
  const ws = wb.addWorksheet('тПосади')
  const colCount = POSITION_HEADERS.length

  // Title row
  const titleRow = ws.addRow(['Посади'])
  titleRow.font = { bold: true, size: 14 }

  // Headers
  const headerRow = ws.addRow(POSITION_HEADERS)
  applyHeaderStyle(headerRow, 'FF4472C4', colCount)

  // ID row (mirror of parser: row 2 = IDs)
  ws.addRow(POSITION_HEADERS.map((_, i) => `col${i}`))

  // Data
  for (const p of data.positions) {
    const row: (string | number | null)[] = new Array(colCount).fill(null)
    row[0] = p.positionIndex
    row[2] = p.subdivisionCode
    row[4] = p.title
    row[5] = p.rankRequired
    row[6] = p.specialtyCode
    row[7] = p.tariffGrade
    row[9] = p.staffNumber
    row[12] = p.notes
    ws.addRow(row)
  }

  // Column widths
  ws.getColumn(1).width = 14
  ws.getColumn(3).width = 12
  ws.getColumn(5).width = 35
  ws.getColumn(6).width = 20
  ws.getColumn(7).width = 10
  ws.getColumn(8).width = 8
  ws.getColumn(10).width = 14
  ws.getColumn(13).width = 20
}

// ==================== PERSONNEL SHEET (ООС / Виключені) ====================

const PERSONNEL_HEADERS = [
  'Категорія',              // 0
  'Звання',                 // 1
  'ПІБ',                    // 2
  'ІПН',                    // 3
  'Позивний',               // 4
  'Дата народження',       // 5
  'Телефон',                // 6
  'Дата наказу зарах.',    // 7
  'Наказ зарах. інфо',    // 8
  'Звідки прибув',         // 9
  'Посада прибуття',       // 10
  'Дата зарахування',      // 11
  'Номер наказу зарах.',   // 12
  '',                        // 13
  '',                        // 14
  '',                        // 15
  'Поточна посада',        // 16
  'Поточний підрозділ',    // 17
  '',                        // 18
  'Поточний статус',       // 19
  '',                        // 20
  '',                        // 21
  '',                        // 22
  '',                        // 23
  '',                        // 24
  '',                        // 25
  '',                        // 26
  '',                        // 27
  'Дата наказу звання',    // 28
  'Наказ звання інфо',    // 29
  'Вид служби',            // 30
  'Дата контракту',        // 31
  'Тип контракту',         // 32
  '',                        // 33
  'Номер документа',       // 34
  '',                        // 35
  '',                        // 36
  'Тип документа',         // 37
  'Місце народження',      // 38
  'Дата призову',          // 39
  'ТЦК',                    // 40
  'Область',                // 41
  'Освіта',                 // 42
  'Заклад освіти',         // 43
  'Рік закінчення',        // 44
  'Адреса фактична',      // 45
  'Сімейний стан',         // 46
  'Рідні',                  // 47
  'Стать',                  // 48
  '',                        // 49
  'Придатність',           // 50
  'Група крові',           // 51
  'Додаткова інформація'  // 52
]

function personnelToRow(p: ExportPersonnel): (string | number | null)[] {
  const row: (string | number | null)[] = new Array(53).fill(null)
  row[0] = p.rankCategory
  row[1] = p.rankName
  row[2] = p.fullName
  row[3] = p.ipn
  row[4] = p.callsign
  row[5] = p.dateOfBirth
  row[6] = p.phone
  row[7] = p.enrollmentOrderDate
  row[8] = p.enrollmentOrderInfo
  row[9] = p.arrivedFrom
  row[10] = p.arrivalPositionIdx
  row[11] = p.enrollmentDate
  row[12] = p.enrollmentOrderNum
  row[16] = p.currentPositionIdx
  row[17] = p.currentSubdivision
  row[19] = p.currentStatusCode
  row[28] = p.rankOrderDate
  row[29] = p.rankOrderInfo
  row[30] = p.serviceType
  row[31] = p.contractDate
  row[32] = p.contractTypeName
  row[34] = p.idDocNumber
  row[37] = p.idDocType
  row[38] = p.birthplace
  row[39] = p.conscriptionDate
  row[40] = p.tccName
  row[41] = p.oblast
  row[42] = p.educationLevelName
  row[43] = p.educationInstitution
  row[44] = p.educationYear
  row[45] = p.addressActual
  row[46] = p.maritalStatus
  row[47] = p.relativesInfo
  row[48] = p.gender
  row[50] = p.fitness
  row[51] = p.bloodTypeName
  row[52] = p.additionalInfo
  return row
}

function addPersonnelSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  data: ExportPersonnel[],
  bgColor: string
): void {
  const ws = wb.addWorksheet(sheetName)
  const colCount = PERSONNEL_HEADERS.length

  // Headers row
  const headerRow = ws.addRow(PERSONNEL_HEADERS)
  applyHeaderStyle(headerRow, bgColor, colCount)

  // Sub-headers row (empty)
  ws.addRow(new Array(colCount).fill(''))

  // ID row
  ws.addRow(PERSONNEL_HEADERS.map((_, i) => `col${i}`))

  // Data rows
  for (const p of data) {
    ws.addRow(personnelToRow(p))
  }

  // Column widths
  ws.getColumn(1).width = 14  // category
  ws.getColumn(2).width = 18  // rank
  ws.getColumn(3).width = 30  // fullName
  ws.getColumn(4).width = 14  // ipn
  ws.getColumn(5).width = 12  // callsign
  ws.getColumn(6).width = 14  // dateOfBirth
  ws.getColumn(7).width = 14  // phone
  ws.getColumn(17).width = 14 // currentPositionIdx
  ws.getColumn(18).width = 12 // currentSubdivision
  ws.getColumn(20).width = 10 // currentStatusCode
  ws.getColumn(39).width = 20 // birthplace
  ws.getColumn(46).width = 20 // addressActual
}

// ==================== MOVEMENTS SHEET ====================

const MOVEMENT_HEADERS = [
  '',                   // 0
  'Видавець наказу',   // 1
  'Номер наказу',      // 2
  'Дата наказу',       // 3
  'Тип наказу',        // 4
  'ІПН',               // 5
  '',                   // 6
  '',                   // 7
  'Індекс посади',     // 8
  'Номер добового',    // 9
  'Дата з',            // 10
  '',                   // 11
  'Дата до',           // 12
  'Попередня посада',  // 13
  '',                   // 14
  '',                   // 15
  '',                   // 16
  'Активна'            // 17
]

function addMovementsSheet(wb: ExcelJS.Workbook, data: ExportMovement[]): void {
  const ws = wb.addWorksheet('тПереміщення')
  const colCount = MOVEMENT_HEADERS.length

  // Headers
  const headerRow = ws.addRow(MOVEMENT_HEADERS)
  applyHeaderStyle(headerRow, 'FF7030A0', colCount)

  // ID row
  ws.addRow(MOVEMENT_HEADERS.map((_, i) => `col${i}`))

  // Data
  for (const m of data) {
    const row: (string | number | null)[] = new Array(colCount).fill(null)
    row[1] = m.orderIssuer
    row[2] = m.orderNumber
    row[3] = m.orderDate
    row[4] = m.orderType
    row[5] = m.ipn
    row[8] = m.positionIndex
    row[9] = m.dailyOrderNumber
    row[10] = m.dateFrom
    row[12] = m.dateTo
    row[13] = m.previousPosition
    row[17] = m.isActive ? '+' : ''
    ws.addRow(row)
  }

  // Column widths
  ws.getColumn(2).width = 18
  ws.getColumn(3).width = 14
  ws.getColumn(4).width = 14
  ws.getColumn(5).width = 20
  ws.getColumn(6).width = 14
  ws.getColumn(9).width = 14
  ws.getColumn(11).width = 14
  ws.getColumn(13).width = 14
  ws.getColumn(14).width = 18
}

// ==================== STATUS HISTORY SHEET ====================

const STATUS_HEADERS = [
  'ІПН',                  // 0
  '',                      // 1
  '',                      // 2
  'Код статусу',          // 3
  'Група присутності',   // 4
  'Дата з',               // 5
  'Дата до',              // 6
  'Коментар',             // 7
  '',                      // 8
  'Активна',              // 9
  'Остання'               // 10
]

function addStatusHistorySheet(wb: ExcelJS.Workbook, data: ExportStatus[]): void {
  const ws = wb.addWorksheet('тСтатусиІсторія')
  const colCount = STATUS_HEADERS.length

  // Headers
  const headerRow = ws.addRow(STATUS_HEADERS)
  applyHeaderStyle(headerRow, 'FF2E75B6', colCount)

  // ID row
  ws.addRow(STATUS_HEADERS.map((_, i) => `col${i}`))

  // Data
  for (const s of data) {
    const row: (string | number | null)[] = new Array(colCount).fill(null)
    row[0] = s.ipn
    row[3] = s.statusCode
    row[4] = s.presenceGroup
    row[5] = s.dateFrom
    row[6] = s.dateTo
    row[7] = s.comment
    row[9] = s.isActive ? '+' : ''
    row[10] = s.isLast ? '+' : ''
    ws.addRow(row)
  }

  // Column widths
  ws.getColumn(1).width = 14
  ws.getColumn(4).width = 12
  ws.getColumn(5).width = 18
  ws.getColumn(6).width = 14
  ws.getColumn(7).width = 14
  ws.getColumn(8).width = 25
}

// ==================== BUILD WORKBOOK ====================

export function buildEjoosWorkbook(data: ExportData): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'АльваресAI'
  wb.created = new Date()

  addPositionsSheet(wb, data)
  addPersonnelSheet(wb, 'ООС', data.active, 'FF548235')
  addPersonnelSheet(wb, 'Виключені', data.excluded, 'FFBF8F00')
  addMovementsSheet(wb, data.movements)
  addStatusHistorySheet(wb, data.statuses)

  return wb
}
