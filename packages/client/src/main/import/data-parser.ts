/**
 * Parser for Data.xlsx file
 * Extracts: demographic data (passport, UBD, relatives, blood type, etc.)
 * Key: IPN (col 8)
 */
import * as XLSX from 'xlsx'
import { cellStr, cellDate } from './parse-utils'
import type { ParsedDataRecord, ParseError, DataParseResult } from '@shared/types/import'

/**
 * Parse Data.xlsx file
 * @param filePath path to Data.xlsx
 * @param existingIpns set of IPNs already in DB (for matching stats)
 */
export function parseDataFile(
  filePath: string,
  existingIpns?: Set<string>
): DataParseResult {
  const wb = XLSX.readFile(filePath, { type: 'file', cellDates: false, raw: true })
  const errors: ParseError[] = []

  // Take first sheet
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    return {
      records: [],
      errors: [{ row: 0, sheet: '', field: '', message: 'Файл не містить аркушів', severity: 'error' }],
      stats: { totalRecords: 0, matchedCount: 0, unmatchedCount: 0 }
    }
  }

  const sheet = wb.Sheets[sheetName]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null })
  const records: ParsedDataRecord[] = []

  // Row 0=headers, 1+=data
  const startRow = 1
  const seenIpn = new Set<string>()

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const ipn = cellStr(row, 8) // IPN is in column 8
    if (!ipn) continue

    if (!/^\d{10}$/.test(ipn)) {
      errors.push({ row: i + 1, sheet: sheetName, field: 'ipn', message: `Невірний формат ІПН: ${ipn}`, severity: 'warning' })
      continue
    }

    if (seenIpn.has(ipn)) {
      errors.push({ row: i + 1, sheet: sheetName, field: 'ipn', message: `Дублікат ІПН: ${ipn}`, severity: 'warning' })
      continue
    }
    seenIpn.add(ipn)

    records.push({
      ipn,
      nationality: cellStr(row, 6),
      citizenship: cellStr(row, 7),
      addressActual: cellStr(row, 15),
      addressRegistered: cellStr(row, 16),
      relativesInfo: cellStr(row, 20),
      bloodTypeName: cellStr(row, 21),
      militaryIdSeries: cellStr(row, 22),
      militaryIdNumber: cellStr(row, 23),
      passportSeries: cellStr(row, 25),
      passportNumber: cellStr(row, 26),
      passportIssuedBy: cellStr(row, 28),
      passportIssuedDate: cellDate(row, 29),
      ubdSeries: cellStr(row, 30),
      ubdNumber: cellStr(row, 31),
      ubdDate: cellDate(row, 33)
    })
  }

  // Calculate match stats
  let matchedCount = 0
  let unmatchedCount = 0
  if (existingIpns) {
    for (const r of records) {
      if (existingIpns.has(r.ipn)) matchedCount++
      else unmatchedCount++
    }
  }

  return {
    records,
    errors,
    stats: {
      totalRecords: records.length,
      matchedCount,
      unmatchedCount
    }
  }
}
