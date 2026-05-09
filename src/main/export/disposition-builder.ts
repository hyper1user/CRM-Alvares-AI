/**
 * Build «Бойове розпорядження» (Disposition) report as .docx.
 *
 * v1.6.0 MVP: TS-port з Alvares-AI/core/br_roles.py:generate_br_word +
 * dodatky_parser.py. Базується на шаблоні `resources/templates/
 * disposition-template.docx` (трансформованому з Variant_A).
 *
 * v1.6.1: rendering розділений на pure `renderDispositionBuffer()` (без I/O
 * на save) + обгортку `buildDispositionReport()` (зі save-dialog для
 * backward compat single-day). Batch-генерація на період викликає
 * `renderDispositionBuffer()` напряму у циклі — без повторних діалогів.
 *
 * MVP-обмеження (розширення в v1.6.1+):
 *   * Auto-assign ролей за посадою (через `autoAssignRole()` з
 *     br-roles.ts) — юзерського override через UI поки немає.
 *   * ROP-блок (умовний `{{#hasRop}}...{{/hasRop}}`) — за замовчуванням
 *     прихований; юзер додає вручну в Word'і. Alvares-AI має селектор
 *     ROP1/ROP2/.../ROP_FIRST — додамо у v1.6.1+.
 *
 * Що автоматично:
 *   * Номер БР роти — `getBrNumber(executionDate)` (doy формула з v1.5.0).
 *   * Дата БР роти — `executionDate - 1 day`.
 *   * КСП роти + населений пункт — lookup у `resources/br/locations.md`
 *     (останній період з датою ≤ executionDate).
 *   * 15 ролей заповнені з ОС що мають active+Г-3+attendance(100|роп).
 *   * ACK_LIST — список усіх задіяних ОС з рангами.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { dialog, app } from 'electron'
import { join } from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { getDatabase } from '../db/connection'
import { personnel, ranks, positions, attendance, statusTypes } from '../db/schema'
import { eq, and, asc, sql } from 'drizzle-orm'
import { BR_ROLES, BR_ROLE_BY_NAME } from '@shared/enums/br-roles'
import { getBrNumber } from './br-calculator'

interface SoldierForBr {
  fullName: string
  rankName: string | null
  positionTitle: string | null
  positionIdx: string | null
}

interface LocationEntry {
  date: Date
  settlement: string
  ksp: string
}

/**
 * Парсер `resources/br/locations.md` — TS-port dodatky_parser.py.
 *
 * Формат рядка: `|***DD.MM.YYYY***|населений\_пункт|КСП\_РОТИ|`.
 * Зворотні слеші — markdown-escape (\_), прибираємо.
 */
function parseLocations(filepath: string): LocationEntry[] {
  if (!existsSync(filepath)) return []
  const content = readFileSync(filepath, 'utf-8')
  const entries: LocationEntry[] = []
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line.startsWith('|')) continue
    if (line.includes('Період') || line.replace(/[|\-]/g, '').trim() === '') continue

    const parts = line.split('|').map((p) => p.trim()).filter(Boolean)
    if (parts.length < 3) continue

    const dateStr = parts[0].replace(/\*+/g, '').replace(/\\/g, '').trim()
    const m = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
    if (!m) continue

    const [, dd, mm, yyyy] = m
    entries.push({
      date: new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10)),
      settlement: parts[1].replace(/\\/g, '').trim(),
      ksp: parts[2].replace(/\\/g, '').trim()
    })
  }
  entries.sort((a, b) => a.date.getTime() - b.date.getTime())
  return entries
}

/**
 * Останній період з датою ≤ executionDate.
 * Якщо нема — повертає '—'/'—' (як у Alvares-AI).
 */
function getLocationForDate(filepath: string, executionDate: Date): { settlement: string; ksp: string } {
  const entries = parseLocations(filepath)
  let result: LocationEntry | null = null
  const target = executionDate.getTime()
  for (const entry of entries) {
    if (entry.date.getTime() <= target) {
      result = entry
    } else {
      break
    }
  }
  return result
    ? { settlement: result.settlement, ksp: result.ksp }
    : { settlement: '—', ksp: '—' }
}

/**
 * Конвертує «Прізвище Ім'я По-батькові» → «звання ПРІЗВИЩЕ Ім'я По-батькові»
 * (формат для тексту в Розпорядженні — той самий що в Alvares-AI/
 * br_updater.py:pib_to_document_format).
 */
function pibToDocumentFormat(fullName: string, rank: string | null): string {
  const parts = fullName.trim().split(/\s+/)
  let formatted: string
  if (parts.length < 2) {
    formatted = fullName.toUpperCase()
  } else {
    formatted = `${parts[0].toUpperCase()} ${parts.slice(1).join(' ')}`
  }
  return rank?.trim() ? `${rank.trim()} ${formatted}` : formatted
}

/**
 * Формат для АРКУША ДОВЕДЕННЯ:
 * «звання____________________Ім'я ПРІЗВИЩЕ» (20 підкреслень для підпису).
 * 1-в-1 з Alvares-AI/br_updater.py:pib_to_table_format.
 */
function pibToAckFormat(fullName: string, rank: string | null): string {
  const parts = fullName.trim().split(/\s+/)
  const namePart =
    parts.length < 2
      ? fullName.toUpperCase()
      : `${parts[1]} ${parts[0].toUpperCase()}`
  const rankPart = rank?.trim() ?? ''
  // 20 underscores — місце для рукописного підпису.
  return `${rankPart}____________________${namePart}`
}

function resolveResourcePath(relPath: string): string | null {
  const candidates = [
    join(process.resourcesPath ?? '', relPath),
    join(app.getAppPath(), 'resources', relPath)
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

export interface RenderedDisposition {
  buffer: Buffer
  /** Номер БР роти (без префіксу № і дати), для іменування файлу. */
  dispositionNumber: string
  /** Дата БР роти (DD.MM.YYYY), для іменування файлу. */
  dispositionDate: string
}

/**
 * Pure rendering — синхронно читає БД (на день) та шаблон, рендерить .docx,
 * повертає буфер + метадані для іменування файлу. Без I/O на save.
 *
 * Викликається у двох контекстах:
 * 1. Single-day через `buildDispositionReport()` → showSaveDialog.
 * 2. Period (v1.6.1) через `generateDispositionDocument()` → loop по днях,
 *    запис у вибрану папку.
 */
export function renderDispositionBuffer(
  executionDate: Date,
  brBatNumber: string,
  brBatDate: string,
  templatePath: string
): RenderedDisposition {
  const db = getDatabase()
  const isoDate = `${executionDate.getFullYear()}-${String(executionDate.getMonth() + 1).padStart(2, '0')}-${String(executionDate.getDate()).padStart(2, '0')}`

  // 1. Беремо ОС з attendance × status_types на executionDate з кодами 100|роп.
  // Включаємо brRole — це визначає шлях розподілу:
  //   * dgvCode='роп' → завжди в positionPool ({{ROP}}). Боєць фізично
  //     на ЛБЗ, навіть якщо є призначена роль — у Розпорядженні він не
  //     виконує цю роль, він на позиції.
  //   * dgvCode='100' AND brRole IS NOT NULL → відповідна {{ROLE_*}}.
  //   * dgvCode='100' AND brRole IS NULL → positionPool (як non-assigned РВ).
  const rows = db
    .select({
      personnelId: personnel.id,
      fullName: personnel.fullName,
      rankName: ranks.name,
      positionTitle: positions.title,
      positionIdx: personnel.currentPositionIdx,
      dgvCode: statusTypes.dgvCode,
      brRole: personnel.brRole
    })
    .from(attendance)
    .innerJoin(personnel, eq(attendance.personnelId, personnel.id))
    .innerJoin(statusTypes, eq(attendance.statusCode, statusTypes.code))
    .leftJoin(ranks, eq(personnel.rankId, ranks.id))
    .leftJoin(positions, eq(personnel.currentPositionIdx, positions.positionIndex))
    .where(and(
      eq(attendance.date, isoDate),
      eq(personnel.status, 'active'),
      eq(personnel.currentSubdivision, 'Г-3'),
      sql`${statusTypes.dgvCode} IN ('100', 'роп')`
    ))
    .orderBy(asc(personnel.currentPositionIdx))
    .all()

  // 2. Розподіл за пріоритетом: РОП > role > positionPool.
  const byRole = new Map<string, SoldierForBr[]>()
  for (const role of BR_ROLES) {
    byRole.set(role.name, [])
  }
  const positionPool: SoldierForBr[] = []
  for (const r of rows) {
    const soldier: SoldierForBr = {
      fullName: r.fullName,
      rankName: r.rankName,
      positionTitle: r.positionTitle,
      positionIdx: r.positionIdx
    }

    // РОП-бійці (dgvCode='роп') ЗАВЖДИ у positionPool — ігноруємо роль,
    // бо вони на ЛБЗ виконують бойові завдання, не штатну роль.
    if (r.dgvCode === 'роп') {
      positionPool.push(soldier)
      continue
    }

    // РВ-бійці (dgvCode='100'): якщо є валідна персистентна роль —
    // у відповідну категорію. Якщо немає — у positionPool. Валідація
    // через BR_ROLE_BY_NAME (захист від stale-значень типу старих ролей,
    // що вже не існують у поточному списку).
    if (r.brRole && BR_ROLE_BY_NAME.has(r.brRole)) {
      byRole.get(r.brRole)!.push(soldier)
    } else {
      positionPool.push(soldier)
    }
  }

  // 3. Формуємо текст для кожного {{ROLE_*}} плейсхолдера.
  // v1.6.0 hotfix: розділювач — `, ` (кома з пробілом), не \n. Так у
  // Alvares-AI: всі ОС однієї ролі в одному параграфі через коми.
  // Це і чистіше виглядає у Word'і, і відповідає еталонному рапорту.
  const formatList = (soldiers: SoldierForBr[], emptyMarker = '—'): string =>
    soldiers.length === 0
      ? emptyMarker
      : soldiers.map((s) => pibToDocumentFormat(s.fullName, s.rankName)).join(', ')

  const roleTexts: Record<string, string> = {}
  for (const role of BR_ROLES) {
    roleTexts[role.placeholderTag] = formatList(byRole.get(role.name) ?? [])
  }

  // 4. Lookup локації для дати.
  const locationsPath = resolveResourcePath('br/locations.md') ?? ''
  const { settlement, ksp } = getLocationForDate(locationsPath, executionDate)

  // 5. ACK_LIST — повний список усіх бійців у форматі для АРКУША ДОВЕДЕННЯ
  // («звання____________________Ім'я ПРІЗВИЩЕ»). Кожен ОС у власному
  // рядку через `\n` — docxtemplater з linebreaks:true перетворить це
  // на <w:br/> всередині одного параграфа (візуально як окремі рядки
  // у Word'і). Те саме поведінка, що в Alvares-AI.
  const ackList = rows
    .map((r) => pibToAckFormat(r.fullName, r.rankName))
    .join('\n')

  // 6. Формула БР роти.
  const dispositionFull = getBrNumber(executionDate) // "№91 від 31.03.2026"
  const dispositionMatch = dispositionFull.match(/^№(\d+) від (.+)$/)
  const dispositionNumber = dispositionMatch ? dispositionMatch[1] : ''
  const dispositionDate = dispositionMatch ? dispositionMatch[2] : ''

  // 7. Render. Шаблон використовує custom delimiters {{...}} (jinja-style),
  // бо так зроблено в оригіналі Alvares-AI; transform-disposition-template.cjs
  // лише замінив <<...>> на {{...}} і {{IF_ROP}} на {{#hasRop}}.
  const buf = readFileSync(templatePath)
  const zip = new PizZip(buf)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => ''
  })

  // v1.6.0 hotfix: ROP — це список ОС на позиціях (не ROP.txt-фраза, як
  // я раніше помилково вважав). Беруться бійці з 100/роп що НЕ потрапили
  // у жодну з 14 «робочих» ролей через auto-assign — тобто ті, чия посада
  // не дала ключового слова. Через коми.
  const ropList = formatList(positionPool, '')

  const renderData: Record<string, string | boolean> = {
    dispositionNumber,
    dispositionDate,
    executionDate: `${String(executionDate.getDate()).padStart(2, '0')}.${String(executionDate.getMonth() + 1).padStart(2, '0')}.${executionDate.getFullYear()}`,
    'бр': brBatNumber,
    'дата_бр': brBatDate,
    'КСП_РОТИ': ksp,
    'населений_пункт': settlement,
    hasRop: false, // MVP: без ударно-пошукового ROP-блоку. v1.6.1 — UI селектор.
    ROP_FIRST: '',
    ROP: ropList, // ОС на позиціях, не fраза з ROP.txt
    ACK_LIST: ackList,
    ...roleTexts
  }

  doc.render(renderData)
  const buffer = doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
  return { buffer, dispositionNumber, dispositionDate }
}

/**
 * Ім'я файлу для збереження: `БР_№<num>_<DD-MM-YYYY>.docx`.
 * Експортується для batch-логіки у IPC handler'і (v1.6.1).
 */
export function buildDispositionFilename(rendered: RenderedDisposition): string {
  return `БР_№${rendered.dispositionNumber}_${rendered.dispositionDate.replace(/\./g, '-')}.docx`
}

/**
 * Single-day обгортка зі save-dialog. Викликається IPC handler'ом коли
 * період = 1 день (RangePicker [today, today]).
 */
export async function buildDispositionReport(
  executionDate: Date,
  brBatNumber: string,
  brBatDate: string,
  templatePath: string
): Promise<{ success: boolean; filePath: string; error?: string }> {
  const rendered = renderDispositionBuffer(executionDate, brBatNumber, brBatDate, templatePath)
  const fileLabel = buildDispositionFilename(rendered).replace(/\.docx$/, '')

  const result = await dialog.showSaveDialog({
    title: 'Зберегти Бойове розпорядження',
    defaultPath: `${fileLabel}.docx`,
    filters: [{ name: 'Word', extensions: ['docx'] }]
  })
  if (result.canceled || !result.filePath) {
    return { success: false, filePath: '' }
  }
  writeFileSync(result.filePath, rendered.buffer)
  return { success: true, filePath: result.filePath }
}
