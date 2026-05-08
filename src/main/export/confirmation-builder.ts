/**
 * Build «Підтвердження» (Confirmation) report as .docx.
 *
 * v1.5.0: новий шаблон monetary-категорії. На відміну від ДГВ-рапорту
 * (xlsx, 4 секції з підставами/правопорушеннями), це Word-документ з
 * 2 секціями:
 *   п.1 — підтвердження безпосередньої участі в бойових діях (100К/РОП)
 *   п.2 — підтвердження виконання бойових (спеціальних) завдань (30К)
 *
 * Колонки таблиці у кожній секції:
 *   №зп | Звання | ПІБ | Посада | Підстава | Дні виконання | Всього діб
 *
 * Особливості:
 *   * Командир роти (positionIndex='Г03001') → grounds = '' (порожнє).
 *     Юзер після генерації відкриває Word і вставляє вручну —
 *     «БР командира 4 ШБ №X від Y; БН командира 4 ШБ №Z від W» приходить
 *     з батальйону.
 *   * Решта ОС → автоматично згенерований список БР через
 *     getBrListForPeriod() (формула №doy_of_year від (D-1)).
 *   * Дні виконання — рвані періоди склеюються через `;`:
 *     «з 01.04.2026 по 05.04.2026; з 11.04.2026 по 15.04.2026».
 *   * Дата рапорту — останній день місяця.
 */
import { readFileSync, writeFileSync } from 'fs'
import { dialog } from 'electron'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { getDatabase } from '../db/connection'
import { personnel, ranks, positions, attendance, statusTypes, settings } from '../db/schema'
import { eq, and, asc, isNotNull, sql } from 'drizzle-orm'
import { calculatePeriods } from './dgv-report-builder'
import { parseDdMmYyyy } from './br-calculator'
import type { DgvPeriod } from '@shared/types/dgv'

const MONTH_NAMES = [
  '', 'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
]

// Командир 12 ШР — visible через positionIndex. Для Красного це Г03001.
// Сюди потрапляємо через первинний запис у штатному розписі. Якщо
// командир зміниться — нічого міняти не треба, бо matching за position,
// а не за ПІБ.
const COMMANDER_POSITION_IDX = 'Г03001'

interface SoldierRow {
  rank: string
  fullName: string
  position: string
  grounds: string
  datesRange: string
  totalDays: string // як рядок, бо docxtemplater лагідніший до strings
}

/**
 * Формує "з DD.MM.YYYY по DD.MM.YYYY; ..." з масиву DgvPeriod.
 */
function formatDatesRange(periods: DgvPeriod[]): string {
  return periods.map((p) => `з ${p.dateFrom} по ${p.dateTo}`).join('; ')
}

/**
 * Сума днів у періодах.
 */
function sumDays(periods: DgvPeriod[]): number {
  return periods.reduce((acc, p) => acc + p.dayCount, 0)
}

/**
 * Розгортає періоди (від-до) у плоский список днів — щоб згенерувати
 * послідовність БР для кожного дня виконання.
 */
function expandPeriodsToDays(periods: DgvPeriod[]): Date[] {
  const days: Date[] = []
  for (const p of periods) {
    const start = parseDdMmYyyy(p.dateFrom)
    const end = parseDdMmYyyy(p.dateTo)
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    while (cur.getTime() <= last.getTime()) {
      days.push(new Date(cur.getTime()))
      cur.setDate(cur.getDate() + 1)
    }
  }
  return days
}

/**
 * Підставу для рядових формуємо через формулу БР для кожного дня.
 * Для командира роти повертаємо порожній рядок — він заповнює вручну.
 */
function buildGroundsForRows(periods: DgvPeriod[], isCommander: boolean): string {
  if (isCommander) return ''
  const days = expandPeriodsToDays(periods)
  if (days.length === 0) return ''
  // Можна було б зробити один формат через getBrListForPeriod(start, end),
  // але для рваних періодів (дві смужки 100К + проміжок іншого) треба
  // саме покрокове розгортання. expandPeriodsToDays вже це робить.
  return days
    .map((d) => {
      const doy = (() => {
        const startUtc = Date.UTC(d.getFullYear(), 0, 1)
        const dUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
        return Math.round((dUtc - startUtc) / 86400000) + 1
      })()
      const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
      const dd = String(prev.getDate()).padStart(2, '0')
      const mm = String(prev.getMonth() + 1).padStart(2, '0')
      return `№${doy} від ${dd}.${mm}.${prev.getFullYear()}`
    })
    .join(', ')
}

export async function buildConfirmationReport(
  year: number,
  month: number,
  templatePath: string
): Promise<{ success: boolean; filePath: string; error?: string }> {
  const db = getDatabase()
  const mm = String(month).padStart(2, '0')
  const firstDay = `${year}-${mm}-01`
  const lastDay = `${year}-${mm}-${new Date(year, month, 0).getDate()}`

  // Personnel
  const personnelRows = db
    .select({
      id: personnel.id,
      fullName: personnel.fullName,
      rankName: ranks.name,
      positionTitle: positions.title,
      positionIdx: personnel.currentPositionIdx,
      ipn: personnel.ipn
    })
    .from(personnel)
    .leftJoin(ranks, eq(personnel.rankId, ranks.id))
    .leftJoin(positions, eq(personnel.currentPositionIdx, positions.positionIndex))
    .where(and(
      eq(personnel.status, 'active'),
      eq(personnel.currentSubdivision, 'Г-3')
    ))
    .orderBy(asc(personnel.currentPositionIdx), asc(personnel.fullName))
    .all()

  // Attendance × status_types — той самий JOIN, що у dgv-report-builder
  const marksRows = db
    .select({
      personnelId: attendance.personnelId,
      date: attendance.date,
      dgvCode: statusTypes.dgvCode
    })
    .from(attendance)
    .innerJoin(statusTypes, eq(attendance.statusCode, statusTypes.code))
    .where(and(
      sql`${attendance.date} >= ${firstDay}`,
      sql`${attendance.date} <= ${lastDay}`,
      isNotNull(statusTypes.dgvCode)
    ))
    .all()

  const marksMap = new Map<number, Record<string, string>>()
  for (const m of marksRows) {
    if (!m.dgvCode) continue
    if (!marksMap.has(m.personnelId)) marksMap.set(m.personnelId, {})
    marksMap.get(m.personnelId)![m.date] = m.dgvCode
  }

  // Build sections.
  // Section 1: дні з кодом '100' або 'роп' (PAY_100_CODES), окремими
  // періодами для кожного коду — але для рапорту ми хочемо просто
  // періоди коли біець був НА БЦЗ, не диференцію 100 vs роп. Тому
  // calculatePeriods з targetCode = ['100','роп'] склеює послідовні
  // дні різних кодів в один діапазон. Це ок.
  // Section 2: дні з кодом '30'.
  const section1: SoldierRow[] = []
  const section2: SoldierRow[] = []

  for (const p of personnelRows) {
    const days = marksMap.get(p.id) ?? {}
    if (Object.keys(days).length === 0) continue

    const isCommander = p.positionIdx === COMMANDER_POSITION_IDX

    const periods100 = calculatePeriods(days, year, month, ['100', 'роп'])
    if (periods100.length > 0) {
      section1.push({
        rank: p.rankName ?? '',
        fullName: p.fullName,
        position: p.positionTitle ?? '',
        grounds: buildGroundsForRows(periods100, isCommander),
        datesRange: formatDatesRange(periods100),
        totalDays: String(sumDays(periods100))
      })
    }

    const periods30 = calculatePeriods(days, year, month, '30')
    if (periods30.length > 0) {
      section2.push({
        rank: p.rankName ?? '',
        fullName: p.fullName,
        position: p.positionTitle ?? '',
        grounds: buildGroundsForRows(periods30, isCommander),
        datesRange: formatDatesRange(periods30),
        totalDays: String(sumDays(periods30))
      })
    }
  }

  // Commander identity for signature — first ОС at COMMANDER_POSITION_IDX.
  // Може відрізнятися від settings (юзер міг там поставити інше). Беремо
  // з реального personnel — це SSOT.
  const commander = personnelRows.find((p) => p.positionIdx === COMMANDER_POSITION_IDX)
  const allSettings = db.select().from(settings).all()
  const settingsMap = new Map(allSettings.map((s) => [s.key, s.value]))
  const commanderRank = commander?.rankName ?? settingsMap.get('commander_rank') ?? ''
  // У Word-підписі зберігається формат «Ім'я ПРІЗВИЩЕ» (різний від
  // повного «Прізвище Ім'я По-батькові» в таблиці). Реконструюємо:
  const commanderName = commander
    ? formatCommanderSignature(commander.fullName)
    : settingsMap.get('commander_name') ?? ''

  // Report date — last day of month (e.g. 30.04.2026, 31.05.2026)
  const lastDayOfMonth = new Date(year, month, 0)
  const reportDate = `${String(lastDayOfMonth.getDate()).padStart(2, '0')}.${mm}.${year}`

  // Render — templatePath передається з document-service через tmpl.filePath
  const buf = readFileSync(templatePath)
  const zip = new PizZip(buf)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => ''
  })
  doc.render({
    section1,
    section2,
    commanderRank,
    commanderName,
    reportDate
  })
  const out = doc.getZip().generate({ type: 'nodebuffer' }) as Buffer

  // Save dialog
  const monthName = MONTH_NAMES[month]
  const result = await dialog.showSaveDialog({
    title: 'Зберегти Підтвердження',
    defaultPath: `Підтвердження_${monthName}_${year}.docx`,
    filters: [{ name: 'Word', extensions: ['docx'] }]
  })
  if (result.canceled || !result.filePath) {
    return { success: false, filePath: '' }
  }

  writeFileSync(result.filePath, out)
  return { success: true, filePath: result.filePath }
}

/**
 * Конвертує «Красний Євген Геннадійович» → «Євген КРАСНИЙ» —
 * формат, прийнятий у підписах військових документів.
 */
function formatCommanderSignature(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  const lastName = parts[0]
  const firstName = parts[1]
  return `${firstName} ${lastName.toUpperCase()}`
}
