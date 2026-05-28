/**
 * Build CSV content from export data
 * UTF-8 with BOM for proper Cyrillic support in Excel
 */
import type { ExportData, ExportPersonnel } from './export-data'

const BOM = '\uFEFF'

const CSV_HEADERS = [
  'ІПН',
  'Категорія',
  'Звання',
  'ПІБ',
  'Позивний',
  'Дата народження',
  'Телефон',
  'Поточна посада',
  'Поточний підрозділ',
  'Поточний статус',
  'Дата зарахування',
  'Вид служби',
  'Тип контракту',
  'Освіта',
  'Стать',
  'Група крові'
]

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function personnelToCsvRow(p: ExportPersonnel): string {
  const fields = [
    p.ipn,
    p.rankCategory,
    p.rankName,
    p.fullName,
    p.callsign,
    p.dateOfBirth,
    p.phone,
    p.currentPositionIdx,
    p.currentSubdivision,
    p.currentStatusCode,
    p.enrollmentDate,
    p.serviceType,
    p.contractTypeName,
    p.educationLevelName,
    p.gender,
    p.bloodTypeName
  ]
  return fields.map(escapeCsv).join(',')
}

export function buildCsvContent(data: ExportData): { content: string; recordsCount: number } {
  const lines: string[] = []

  // Header
  lines.push(CSV_HEADERS.map(escapeCsv).join(','))

  // Active personnel
  for (const p of data.active) {
    lines.push(personnelToCsvRow(p))
  }

  // Excluded personnel
  for (const p of data.excluded) {
    lines.push(personnelToCsvRow(p))
  }

  const recordsCount = data.active.length + data.excluded.length
  const content = BOM + lines.join('\r\n')

  return { content, recordsCount }
}
