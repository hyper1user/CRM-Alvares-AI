/**
 * v1.6.1: Парсер `BR_4ShB.xlsx` — зовнішнього файлу юзера з номерами БР
 * командира 4 ШБ за датами. Використовується для масової генерації Бойових
 * розпоряджень роти на період (RangePicker у Generator'і).
 *
 * Формат файлу (Аркуш1):
 *   | бр   | дата_бр   | (пусто) | бр   | дата_бр   | ...
 *   | 1583 | 9/4/25    |         | 1584 | 9/4/25    |
 *
 * — на один день буває до 4 БР батальйону (колонки A-B, D-E, G-H, J-K).
 * Дата у US-форматі `M/D/YY` (так як SheetJS повертає при `raw: false`).
 *
 * Lookup-by-date — той самий патерн що `parseLocations()` для
 * `resources/br/locations.md` (КСП/н.п. за датою). Якщо для дати немає
 * запису — повертає null, і IPC handler має skip'нути цей день.
 *
 * v1.6.2 TODO: винести шлях у налаштування користувача (зараз hardcoded).
 */
import * as XLSX from 'xlsx'
import { existsSync } from 'fs'

/**
 * Hardcoded шлях до xlsx-довідника БР батальйону.
 * v1.6.2: переїде у налаштування `/settings/integrations`.
 */
export const BR_BAT_XLSX_PATH = 'D:\\Project_CRM\\BR_4ShB.xlsx'

export interface BrBatEntry {
  /** Усі номери БР батальйону на день (multi-BR через `; `). */
  numbers: string[]
  /** Дата у форматі DD.MM.YYYY (готова до підстановки в `{{дата_бр}}`). */
  date: string
}

/**
 * US `M/D/YY` → ISO `YYYY-MM-DD`. yy<50 → 2000+yy, інакше 1900+yy
 * (для нашого файлу range 2025-2026 — yy завжди <50).
 */
function parseUsDate(s: string): string | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  const month = parseInt(m[1], 10)
  const day = parseInt(m[2], 10)
  let year = parseInt(m[3], 10)
  if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isoToUkDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/**
 * Читає xlsx, повертає Map<isoDate, {numbers, date}>. Multi-BR на один день
 * автоматично groups у `numbers[]` за порядком зустрічі (A-B → D-E → G-H → J-K).
 * Якщо файл відсутній або порожній — повертає порожню Map (caller обробляє).
 */
export function parseBrBatXlsx(filepath: string): Map<string, BrBatEntry> {
  const result = new Map<string, BrBatEntry>()
  if (!existsSync(filepath)) return result

  const wb = XLSX.readFile(filepath)
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return result
  const ws = wb.Sheets[sheetName]
  if (!ws) return result

  // raw:false — щоб дати приходили як стрічки `M/D/YY`, а не як serial-number.
  const rows = XLSX.utils.sheet_to_json<Array<string | null | undefined>>(ws, {
    header: 1,
    raw: false
  })

  // Header у row[0]; даних — з row[1].
  // Пари (number, date): A-B (0,1), D-E (3,4), G-H (6,7), J-K (9,10).
  const PAIRS: Array<[number, number]> = [
    [0, 1],
    [3, 4],
    [6, 7],
    [9, 10]
  ]

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    for (const [numIdx, dateIdx] of PAIRS) {
      const numCell = r[numIdx]
      const dateCell = r[dateIdx]
      if (!numCell || !dateCell) continue
      const num = String(numCell).trim()
      const dateStr = String(dateCell).trim()
      if (!num || !dateStr) continue
      const isoDate = parseUsDate(dateStr)
      if (!isoDate) continue
      const existing = result.get(isoDate)
      if (existing) {
        existing.numbers.push(num)
      } else {
        result.set(isoDate, { numbers: [num], date: isoToUkDate(isoDate) })
      }
    }
  }
  return result
}

/**
 * Об'єднати множинні БР через `; ` для підстановки в `{{бр}}`.
 * `['1583','1584']` → `'1583; 1584'`.
 */
export function formatBrNumbers(entry: BrBatEntry): string {
  return entry.numbers.join('; ')
}
