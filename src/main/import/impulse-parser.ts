/**
 * Parser for "Імпульс Toolkit" Excel file
 * Sheet: "Особовий склад", rows 2+ (headers on rows 0-1)
 */
import * as XLSX from 'xlsx'
import { cellStr, cellDate, cellNum } from './parse-utils'

export interface ParsedImpulseRecord {
  ipn: string

  // Паспорт (оновлення існуючих)
  passportIssuedBy: string | null
  passportIssuedDate: string | null
  passportSeries: string | null
  passportNumber: string | null

  // Закордонний паспорт
  foreignPassportIssuedBy: string | null
  foreignPassportIssuedDate: string | null
  foreignPassportSeries: string | null
  foreignPassportNumber: string | null

  // ВОС / спеціальність
  specialtyCode: string | null

  // ВК додатково
  militaryIdIssuedBy: string | null
  militaryIdIssuedDate: string | null
  militaryIdSeries: string | null
  militaryIdNumber: string | null

  // УБД
  ubdIssuedBy: string | null
  ubdDate: string | null
  ubdSeries: string | null
  ubdNumber: string | null

  // Фінансові дані
  iban: string | null
  bankCard: string | null
  bankName: string | null

  // Посвідчення водія
  driverLicenseIssuedBy: string | null
  driverLicenseCategory: string | null
  driverLicenseExpiry: string | null
  driverLicenseIssuedDate: string | null
  driverLicenseExperience: number | null
  driverLicenseSeries: string | null
  driverLicenseNumber: string | null

  // Посвідчення тракториста
  tractorLicenseIssuedBy: string | null
  tractorLicenseCategory: string | null
  tractorLicenseExpiry: string | null
  tractorLicenseIssuedDate: string | null
  tractorLicenseExperience: number | null
  tractorLicenseSeries: string | null
  tractorLicenseNumber: string | null

  // Базова загальновійськова підготовка
  basicTrainingDateFrom: string | null
  basicTrainingDateTo: string | null
  basicTrainingPlace: string | null
  basicTrainingCommander: string | null
  basicTrainingNotes: string | null

  // Група крові (name, for lookup)
  bloodTypeName: string | null
}

export interface ImpulseParseResult {
  records: ParsedImpulseRecord[]
  total: number
  errors: string[]
}

/**
 * Split combined document "СЕРІЯ+НОМЕР" string, e.g. "FT950795" → ["FT", "950795"]
 * Also handles Cyrillic series: "АА123456" → ["АА", "123456"]
 * Returns null if cannot split.
 */
function splitSeriesNumber(combined: string | null): [string | null, string | null] {
  if (!combined) return [null, null]
  const trimmed = combined.trim()
  if (!trimmed) return [null, null]

  // Pattern: 1-3 letters (latin or cyrillic) + digits
  const m = trimmed.match(/^([A-ZА-ЯІЇЄA-Z]{1,3})\s*(\d+)$/i)
  if (m) {
    return [m[1].toUpperCase(), m[2]]
  }

  // If all digits — it's just a number
  if (/^\d+$/.test(trimmed)) {
    return [null, trimmed]
  }

  return [trimmed, null]
}

export function parseImpulseFile(filePath: string): ImpulseParseResult {
  const errors: string[] = []
  const records: ParsedImpulseRecord[] = []

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.readFile(filePath, { cellDates: false, raw: true })
  } catch (e) {
    return { records: [], total: 0, errors: [`Не вдалося відкрити файл: ${String(e)}`] }
  }

  // Find sheet "Особовий склад"
  const sheetName = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes('особовий') || n.toLowerCase().includes('склад') || n.toLowerCase().includes('os')
  )

  if (!sheetName) {
    // Try first sheet
    const first = workbook.SheetNames[0]
    if (!first) {
      return { records: [], total: 0, errors: ['Не знайдено аркуш "Особовий склад"'] }
    }
    errors.push(`Аркуш "Особовий склад" не знайдено, використовується "${first}"`)
  }

  const sheet = workbook.Sheets[sheetName ?? workbook.SheetNames[0]]
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true
  })

  // Skip header rows (0 and 1)
  let processed = 0
  for (let i = 2; i < rawRows.length; i++) {
    const row = rawRows[i] as unknown[]

    // Col 5 = IPN
    const ipn = cellStr(row, 5)
    if (!ipn) continue
    // Validate IPN: 10 digits
    if (!/^\d{10}$/.test(ipn)) {
      errors.push(`Рядок ${i + 1}: невірний ІПН "${ipn}", пропущено`)
      continue
    }

    // Паспорт (оновлення)
    const passportIssuedBy = cellStr(row, 6)
    const passportIssuedDate = cellDate(row, 7)
    const passportCombined = cellStr(row, 8)
    const [passportSeries, passportNumber] = splitSeriesNumber(passportCombined)

    // Закордонний паспорт
    const foreignPassportIssuedBy = cellStr(row, 9)
    const foreignPassportIssuedDate = cellDate(row, 10)
    const foreignCombined = cellStr(row, 11)
    const [foreignPassportSeries, foreignPassportNumber] = splitSeriesNumber(foreignCombined)

    // ВОС
    const specialtyCode = cellStr(row, 12)

    // ВК додатково
    const militaryIdIssuedBy = cellStr(row, 13)
    const militaryIdIssuedDate = cellDate(row, 14)
    // col 15 = combined, col 16 = series, col 17 = number
    const milCombined = cellStr(row, 15)
    const milSeriesRaw = cellStr(row, 16)
    const milNumberRaw = cellStr(row, 17)
    let militaryIdSeries: string | null = milSeriesRaw
    let militaryIdNumber: string | null = milNumberRaw
    if (!militaryIdSeries && !militaryIdNumber && milCombined) {
      const [s, n] = splitSeriesNumber(milCombined)
      militaryIdSeries = s
      militaryIdNumber = n
    }

    // УБД
    const ubdIssuedBy = cellStr(row, 18)
    const ubdDate = cellDate(row, 19)
    // col 20 = combined, col 21 = series, col 22 = number
    const ubdCombined = cellStr(row, 20)
    const ubdSeriesRaw = cellStr(row, 21)
    const ubdNumberRaw = cellStr(row, 22)
    let ubdSeries: string | null = ubdSeriesRaw
    let ubdNumber: string | null = ubdNumberRaw
    if (!ubdSeries && !ubdNumber && ubdCombined) {
      const [s, n] = splitSeriesNumber(ubdCombined)
      ubdSeries = s
      ubdNumber = n
    }

    // Фінансові дані
    const iban = cellStr(row, 23)
    const bankCard = cellStr(row, 24)
    const bankName = cellStr(row, 25)

    // Посвідчення водія (cols 26-33: issuedBy, category, expiry, issuedDate, experience, combined, series, number)
    const driverLicenseIssuedBy = cellStr(row, 26)
    const driverLicenseCategory = cellStr(row, 27)
    const driverLicenseExpiry = cellDate(row, 28)
    const driverLicenseIssuedDate = cellDate(row, 29)
    const driverLicenseExperience = cellNum(row, 30)
    const driverCombined = cellStr(row, 31)
    const driverSeriesRaw = cellStr(row, 32)
    const driverNumberRaw = cellStr(row, 33)
    let driverLicenseSeries: string | null = driverSeriesRaw
    let driverLicenseNumber: string | null = driverNumberRaw
    if (!driverLicenseSeries && !driverLicenseNumber && driverCombined) {
      const [s, n] = splitSeriesNumber(driverCombined)
      driverLicenseSeries = s
      driverLicenseNumber = n
    }

    // Посвідчення тракториста (cols 34-40: issuedBy, category, expiry, issuedDate, experience, series, number)
    const tractorLicenseIssuedBy = cellStr(row, 34)
    const tractorLicenseCategory = cellStr(row, 35)
    const tractorLicenseExpiry = cellDate(row, 36)
    const tractorLicenseIssuedDate = cellDate(row, 37)
    const tractorLicenseExperience = cellNum(row, 38)
    const tractorLicenseSeries = cellStr(row, 39)
    const tractorLicenseNumber = cellStr(row, 40)

    // Базова загальновійськова підготовка (cols 41-45)
    const basicTrainingDateFrom = cellDate(row, 41)
    const basicTrainingDateTo = cellDate(row, 42)
    const basicTrainingPlace = cellStr(row, 43)
    const basicTrainingCommander = cellStr(row, 44)
    const basicTrainingNotes = cellStr(row, 45)

    // Група крові
    const bloodTypeName = cellStr(row, 46)

    records.push({
      ipn,
      passportIssuedBy,
      passportIssuedDate,
      passportSeries,
      passportNumber,
      foreignPassportIssuedBy,
      foreignPassportIssuedDate,
      foreignPassportSeries,
      foreignPassportNumber,
      specialtyCode,
      militaryIdIssuedBy,
      militaryIdIssuedDate,
      militaryIdSeries,
      militaryIdNumber,
      ubdIssuedBy,
      ubdDate,
      ubdSeries,
      ubdNumber,
      iban,
      bankCard,
      bankName,
      driverLicenseIssuedBy,
      driverLicenseCategory,
      driverLicenseExpiry,
      driverLicenseIssuedDate,
      driverLicenseExperience: driverLicenseExperience !== null ? Math.round(driverLicenseExperience) : null,
      driverLicenseSeries,
      driverLicenseNumber,
      tractorLicenseIssuedBy,
      tractorLicenseCategory,
      tractorLicenseExpiry,
      tractorLicenseIssuedDate,
      tractorLicenseExperience: tractorLicenseExperience !== null ? Math.round(tractorLicenseExperience) : null,
      tractorLicenseSeries,
      tractorLicenseNumber,
      basicTrainingDateFrom,
      basicTrainingDateTo,
      basicTrainingPlace,
      basicTrainingCommander,
      basicTrainingNotes,
      bloodTypeName
    })

    processed++
  }

  return { records, total: processed, errors }
}
