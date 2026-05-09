/**
 * Document Service — template management, document generation, archive
 */
import { app, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, copyFileSync, unlinkSync } from 'fs'
import { getDatabase } from '../db/connection'
import { documentTemplates, generatedDocuments, settings, personnel, auditLog } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { generateDocx, getTemplateTags, createMinimalDocx } from './docx-engine'
import { buildDgvReport } from '../export/dgv-report-builder'
import { buildConfirmationReport } from '../export/confirmation-builder'
import {
  buildDispositionReport,
  renderDispositionBuffer,
  buildDispositionFilename
} from '../export/disposition-builder'
import {
  BR_BAT_XLSX_PATH,
  parseBrBatXlsx,
  formatBrNumbers
} from '../export/br-bat-parser'
import { dialog } from 'electron'
import type {
  DocumentTemplate,
  GeneratedDocument,
  GenerateDocumentRequest,
  GeneratedDocumentListItem,
  DocumentListFilters,
  TemplateCategory,
  BatchGenerationResult
} from '@shared/types/document'

// Paths
function getTemplatesDir(): string {
  const dir = join(app.getPath('userData'), 'templates')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function getDocumentsDir(): string {
  const dir = join(app.getPath('userData'), 'documents')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

// ==================== TEMPLATE DEFINITIONS ====================

interface TemplateDefinition {
  name: string
  templateType: string
  category: TemplateCategory
  description: string
  fileName: string
  lines: string[] // fallback content if .docx file not in resources/
}

// v1.4.0: 3 архівні шаблони (Наказ по ОС, Відпускний квиток, Довідка про
// поранення) видалені з seed для нових БД. Існуючі БД зберігають їх як
// category='retired' через addCategoryToDocumentTemplates() — UI не показує.
const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  // ==================== ПОДІЇ (event) ====================
  {
    name: 'Доповідь 1×300',
    templateType: 'report',
    category: 'event',
    description: 'Доповідь про одиночне поранення (300)',
    fileName: 'report-300-single.docx',
    lines: []
  },
  {
    name: 'Доповідь 1×БТ',
    templateType: 'report',
    category: 'event',
    description: 'Доповідь про бойову травму (одиночна)',
    fileName: 'report-bt-single.docx',
    lines: []
  },
  {
    name: 'Доповідь 1×ЗБ',
    templateType: 'report',
    category: 'event',
    description: 'Доповідь про загибель (одиночна)',
    fileName: 'report-combat-loss-single.docx',
    lines: []
  },
  {
    name: 'Доповідь 200',
    templateType: 'report',
    category: 'event',
    description: 'Доповідь про безповоротну втрату (200)',
    fileName: 'report-200.docx',
    lines: []
  },
  {
    name: 'Доповідь 2+×300',
    templateType: 'report',
    category: 'event',
    description: 'Доповідь про множинні поранення (300)',
    fileName: 'report-300-multi.docx',
    lines: []
  },
  {
    name: 'Доповідь повернення (рез. бат.)',
    templateType: 'report',
    category: 'event',
    description: 'Доповідь про повернення з СЗЧ до резервного батальйону',
    fileName: 'report-return-reserve.docx',
    lines: []
  },
  {
    name: 'Доповідь повернення (підрозділ)',
    templateType: 'report',
    category: 'event',
    description: 'Доповідь про повернення з СЗЧ до підрозділу',
    fileName: 'report-return-unit.docx',
    lines: []
  },
  {
    name: 'Рапорт 1×300',
    templateType: 'report',
    category: 'event',
    description: 'Рапорт про одиночне поранення (300)',
    fileName: 'raport-300-single.docx',
    lines: []
  },
  {
    name: 'Рапорт 1×ЗБ',
    templateType: 'report',
    category: 'event',
    description: 'Рапорт про загибель',
    fileName: 'raport-combat-loss.docx',
    lines: []
  },
  {
    name: 'Рапорт 200',
    templateType: 'report',
    category: 'event',
    description: 'Рапорт про безповоротну втрату (200)',
    fileName: 'raport-200.docx',
    lines: []
  },
  {
    name: 'Рапорт 2+×БТ',
    templateType: 'report',
    category: 'event',
    description: 'Рапорт про множинні бойові травми',
    fileName: 'raport-bt-multi.docx',
    lines: []
  },

  // ==================== РАПОРТИ (raport) ====================
  {
    name: 'Рапорт відпустка (за сімейними)',
    templateType: 'report',
    category: 'raport',
    description: 'Рапорт на відпустку за сімейними обставинами',
    fileName: 'raport-leave-family.docx',
    lines: []
  },
  {
    name: 'Рапорт відпустка (основна)',
    templateType: 'report',
    category: 'raport',
    description: 'Рапорт на основну щорічну відпустку',
    fileName: 'raport-leave-main.docx',
    lines: []
  },
  {
    name: 'Рапорт ВПХ',
    templateType: 'report',
    category: 'raport',
    description: 'Рапорт на відпустку по хворобі',
    fileName: 'raport-leave-medical.docx',
    lines: []
  },

  // ==================== ЗВІЛЬНЕННЯ/ПЕРЕВОД (discharge) ====================
  {
    name: 'Звільнення — відпустка УБД',
    templateType: 'certificate',
    category: 'discharge',
    description: 'Звільнення: відпустка учасника бойових дій',
    fileName: 'discharge-leave-ubd.docx',
    lines: []
  },
  {
    name: 'Звільнення — здача посади',
    templateType: 'certificate',
    category: 'discharge',
    description: 'Звільнення: акт здачі-прийому посади',
    fileName: 'discharge-handover.docx',
    lines: []
  },
  {
    name: 'Звільнення — речове майно',
    templateType: 'certificate',
    category: 'discharge',
    description: 'Звільнення: виплата за неотримане речове майно',
    fileName: 'discharge-clothing.docx',
    lines: []
  },
  {
    name: 'Звільнення — направлення на облік',
    templateType: 'certificate',
    category: 'discharge',
    description: 'Звільнення: направлення на військовий облік',
    fileName: 'discharge-registration.docx',
    lines: []
  },
  {
    name: 'Звільнення — невикористана відпустка',
    templateType: 'certificate',
    category: 'discharge',
    description: 'Звільнення: компенсація невикористаної відпустки',
    fileName: 'discharge-unused-leave.docx',
    lines: []
  },
  {
    name: 'Звільнення — оздоровчі',
    templateType: 'certificate',
    category: 'discharge',
    description: 'Звільнення: оздоровчі виплати',
    fileName: 'discharge-health.docx',
    lines: []
  },
  {
    name: 'Звільнення — соціально-побутові',
    templateType: 'certificate',
    category: 'discharge',
    description: 'Звільнення: соціально-побутові виплати',
    fileName: 'discharge-social.docx',
    lines: []
  },

  // ==================== ГРОШОВЕ ЗАБЕЗПЕЧЕННЯ (monetary) ====================
  // v1.4.0: спеціальний шаблон з templateType='xlsx_dgv' — генератор не
  // використовує docxtemplater, а викликає dgv-report-builder напряму.
  // UI Генератора має special-case: вибір місяця замість TemplateFieldsForm.
  {
    name: 'ДГВ-рапорт',
    templateType: 'xlsx_dgv',
    category: 'monetary',
    description: 'Рапорт ДГВ на місяць (4 секції: 100К/30К/п.6/п.7) у форматі .xlsx',
    fileName: 'dgv-report-special.placeholder',
    lines: []
  },
  // v1.5.0: Підтвердження участі — звичайний docx pipeline, але зі
  // спеціальним UI (DatePicker замість TemplateFieldsForm). Генерація
  // через окремий handler `generateConfirmationDocument`, який знає
  // про дві loop-секції {#section1}/{#section2}, БР-формулу для
  // рядових і командирське виключення.
  {
    name: 'Підтвердження',
    templateType: 'docx_confirmation',
    category: 'monetary',
    description: 'Підтвердження участі у бойових діях за місяць (п.1=100К/РОП + п.2=30К) у форматі .docx',
    fileName: 'confirmation-template.docx',
    lines: []
  },
  // v1.6.0: Бойове розпорядження. Спецкейс UI — DateRangePicker (start
  // = end як 1 день у MVP), 2 текстові поля для номера/дати БР батальйону.
  // Auto-assign 15 ролей за посадою; lookup КСП/н.п. з resources/br/locations.md.
  {
    name: 'Бойове розпорядження',
    templateType: 'docx_disposition',
    category: 'monetary',
    description: 'Бойове розпорядження командира 12 ШР на день виконання у форматі .docx',
    fileName: 'disposition-template.docx',
    lines: []
  }
]

// ==================== TEMPLATE MANAGEMENT ====================

/**
 * Seed default templates: create .docx files + insert DB records
 */
export function seedDefaultTemplates(): void {
  const db = getDatabase()
  const existing = db.select().from(documentTemplates).all()
  const existingNames = new Set(existing.map((t) => t.name))

  // Filter only templates not yet in DB
  const toSeed = DEFAULT_TEMPLATES.filter((def) => !existingNames.has(def.name))
  if (toSeed.length === 0) return

  console.log(`[documents] Seeding ${toSeed.length} new templates...`)
  const templatesDir = getTemplatesDir()

  for (const def of toSeed) {
    let filePath: string

    if (def.templateType === 'xlsx_dgv') {
      // v1.4.0: спеціальний шаблон без .docx — генерація через
      // dgv-report-builder.ts. filePath — синтетичний маркер, ніколи
      // не читається (Generator UI має special-case для xlsx_dgv).
      filePath = 'special:xlsx_dgv'
    } else {
      filePath = join(templatesDir, def.fileName)
      const resourcePath = getResourceTemplatePath(def.fileName)
      if (resourcePath && existsSync(resourcePath)) {
        copyFileSync(resourcePath, filePath)
      } else if (def.lines.length > 0) {
        const buffer = createMinimalDocx(def.lines)
        writeFileSync(filePath, buffer)
      } else {
        console.warn(`[documents] Skipping template "${def.name}": no source file found`)
        continue
      }
    }

    db.insert(documentTemplates)
      .values({
        name: def.name,
        templateType: def.templateType,
        filePath,
        description: def.description,
        isDefault: true,
        category: def.category
      })
      .run()
  }

  console.log(`[documents] Seeded ${toSeed.length} templates (total: ${existing.length + toSeed.length})`)
}

function getResourceTemplatePath(fileName: string): string | null {
  // In packaged app: process.resourcesPath/templates/
  // In dev: resources/templates/
  const paths = [
    join(process.resourcesPath ?? '', 'templates', fileName),
    join(app.getAppPath(), 'resources', 'templates', fileName)
  ]
  for (const p of paths) {
    if (existsSync(p)) return p
  }
  return null
}

/**
 * List all templates
 */
export function listTemplates(): DocumentTemplate[] {
  const db = getDatabase()
  return db.select().from(documentTemplates).all() as DocumentTemplate[]
}

/**
 * Get template tags by template ID
 */
export function getTemplateTagsById(templateId: number): string[] {
  const db = getDatabase()
  const tmpl = db
    .select()
    .from(documentTemplates)
    .where(eq(documentTemplates.id, templateId))
    .get() as DocumentTemplate | undefined

  if (!tmpl || !existsSync(tmpl.filePath)) return []

  return getTemplateTags(tmpl.filePath)
}

// ==================== DOCUMENT GENERATION ====================

/**
 * Generate a document from template + fields
 */
export function generateDocument(request: GenerateDocumentRequest): GeneratedDocument {
  const db = getDatabase()

  // Get template
  const tmpl = db
    .select()
    .from(documentTemplates)
    .where(eq(documentTemplates.id, request.templateId))
    .get() as DocumentTemplate | undefined

  if (!tmpl) throw new Error(`Template not found: ${request.templateId}`)
  if (!existsSync(tmpl.filePath)) throw new Error(`Template file not found: ${tmpl.filePath}`)

  // Build data map: merge settings + personnel data + request fields
  const data: Record<string, string> = {}

  // Settings (unit info) — both Latin and Cyrillic keys
  const allSettings = db.select().from(settings).all()
  const settingsMap = new Map(allSettings.map((s) => [s.key, s.value]))
  const unitName = settingsMap.get('unit_name') ?? ''
  const unitDesignation = settingsMap.get('unit_designation') ?? ''
  const commanderRank = settingsMap.get('commander_rank') ?? ''
  const commanderName = settingsMap.get('commander_name') ?? ''

  // Latin keys
  data.unitName = unitName
  data.unitDesignation = unitDesignation
  data.commanderRank = commanderRank
  data.commanderName = commanderName
  // Cyrillic keys (for <<>> templates)
  data['Назва частини'] = unitName
  data['Позначення частини'] = unitDesignation
  data['Командир звання'] = commanderRank
  data['Командир ПІБ'] = commanderName

  // Personnel auto-fill (first personnel if provided)
  if (request.personnelIds && request.personnelIds.length > 0) {
    const person = db
      .select()
      .from(personnel)
      .where(eq(personnel.id, request.personnelIds[0]))
      .get() as Record<string, unknown> | undefined

    if (person) {
      data.fullName = String(person.fullName ?? '')
      data.ipn = String(person.ipn ?? '')
      // Cyrillic keys
      data['ПІБ'] = data.fullName
      data['ІПН'] = data.ipn
    }
  }

  // Override with request fields (user-entered values take priority)
  Object.assign(data, request.fields)

  // Generate docx
  const buffer = generateDocx(tmpl.filePath, data)

  // Save file
  const docsDir = getDocumentsDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const fileName = `${tmpl.templateType}_${timestamp}_${Date.now()}.docx`
  const filePath = join(docsDir, fileName)
  writeFileSync(filePath, buffer)

  // Insert DB record
  const result = db
    .insert(generatedDocuments)
    .values({
      templateId: tmpl.id,
      documentType: tmpl.templateType,
      title: request.title,
      personnelIds: request.personnelIds ? JSON.stringify(request.personnelIds) : null,
      filePath
    })
    .run()

  const docId = Number(result.lastInsertRowid)

  // Audit log
  db.insert(auditLog)
    .values({
      tableName: 'generated_documents',
      recordId: docId,
      action: 'generate',
      newValues: JSON.stringify({
        templateId: tmpl.id,
        templateType: tmpl.templateType,
        title: request.title,
        filePath
      })
    })
    .run()

  return {
    id: docId,
    templateId: tmpl.id,
    documentType: tmpl.templateType,
    title: request.title,
    personnelIds: request.personnelIds ? JSON.stringify(request.personnelIds) : null,
    filePath,
    generatedAt: new Date().toISOString()
  }
}

/**
 * v1.4.0: Special-case generator для шаблону templateType='xlsx_dgv'.
 *
 * Окрема функція (а не гілка в generateDocument), бо:
 *   1. xlsx-pipeline асинхронний (buildDgvReport показує save-dialog +
 *      ExcelJS writeFile повертає Promise) — не хочеться змінювати
 *      sync-сигнатуру generateDocument для більшості шаблонів.
 *   2. Параметри тут інші — потрібні year/month, а не звичайний tag-map.
 *      У request.fields очікуємо { year: '2026', month: '5' }.
 *   3. Повертає `canceled: true` коли юзер закрив save-dialog — щоб
 *      Generator UI не показав фейкового success.
 *
 * Записує в generated_documents та audit_log тільки після успішного
 * збереження файлу (тобто скасований діалог не лишає мертвих рядків).
 */
export async function generateXlsxDgvDocument(
  request: GenerateDocumentRequest
): Promise<GeneratedDocument | { canceled: true }> {
  const db = getDatabase()

  const tmpl = db
    .select()
    .from(documentTemplates)
    .where(eq(documentTemplates.id, request.templateId))
    .get() as DocumentTemplate | undefined

  if (!tmpl) throw new Error(`Template not found: ${request.templateId}`)
  if (tmpl.templateType !== 'xlsx_dgv') {
    throw new Error(`Expected xlsx_dgv template, got: ${tmpl.templateType}`)
  }

  const yearStr = request.fields?.year ?? ''
  const monthStr = request.fields?.month ?? ''
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (!year || !month || month < 1 || month > 12) {
    throw new Error(`Invalid year/month: ${yearStr}/${monthStr}`)
  }

  // v1.4.0 hotfix: top-level import замість lazy require. У Electron
  // main bundle'иться в один index.js — runtime require зі відносним
  // шляхом не резолвиться. Циркулярного імпорту тут немає
  // (dgv-report-builder не імпортує document-service).
  const result = await buildDgvReport(year, month)

  if (!result.success || !result.filePath) {
    return { canceled: true }
  }

  const dbResult = db
    .insert(generatedDocuments)
    .values({
      templateId: tmpl.id,
      documentType: tmpl.templateType,
      title: request.title,
      personnelIds: null,
      filePath: result.filePath
    })
    .run()

  const docId = Number(dbResult.lastInsertRowid)

  db.insert(auditLog)
    .values({
      tableName: 'generated_documents',
      recordId: docId,
      action: 'generate',
      newValues: JSON.stringify({
        templateId: tmpl.id,
        templateType: tmpl.templateType,
        title: request.title,
        filePath: result.filePath,
        year,
        month
      })
    })
    .run()

  return {
    id: docId,
    templateId: tmpl.id,
    documentType: tmpl.templateType,
    title: request.title,
    personnelIds: null,
    filePath: result.filePath,
    generatedAt: new Date().toISOString()
  }
}

/**
 * v1.5.0: Special-case generator для шаблону templateType='docx_confirmation'.
 *
 * На відміну від generateXlsxDgvDocument:
 *   * Це Word, не Excel. Через docxtemplater з 2 секціями ({#section1},
 *     {#section2}). Шаблон лежить за tmpl.filePath (звичайно копіюється
 *     з resources/templates/confirmation-template.docx у userData/templates
 *     при першому seed).
 *   * Логіка БР-номерів і командирського виключення сидить у
 *     buildConfirmationReport — він приймає шлях до .docx і повертає
 *     filePath після save-dialog'а.
 *
 * Очікує request.fields = { year: '2026', month: '5' }.
 */
export async function generateConfirmationDocument(
  request: GenerateDocumentRequest
): Promise<GeneratedDocument | { canceled: true }> {
  const db = getDatabase()

  const tmpl = db
    .select()
    .from(documentTemplates)
    .where(eq(documentTemplates.id, request.templateId))
    .get() as DocumentTemplate | undefined

  if (!tmpl) throw new Error(`Template not found: ${request.templateId}`)
  if (tmpl.templateType !== 'docx_confirmation') {
    throw new Error(`Expected docx_confirmation template, got: ${tmpl.templateType}`)
  }
  if (!existsSync(tmpl.filePath)) {
    throw new Error(`Template file not found: ${tmpl.filePath}`)
  }

  const yearStr = request.fields?.year ?? ''
  const monthStr = request.fields?.month ?? ''
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (!year || !month || month < 1 || month > 12) {
    throw new Error(`Invalid year/month: ${yearStr}/${monthStr}`)
  }

  const result = await buildConfirmationReport(year, month, tmpl.filePath)
  if (!result.success || !result.filePath) {
    return { canceled: true }
  }

  const dbResult = db
    .insert(generatedDocuments)
    .values({
      templateId: tmpl.id,
      documentType: tmpl.templateType,
      title: request.title,
      personnelIds: null,
      filePath: result.filePath
    })
    .run()
  const docId = Number(dbResult.lastInsertRowid)

  db.insert(auditLog)
    .values({
      tableName: 'generated_documents',
      recordId: docId,
      action: 'generate',
      newValues: JSON.stringify({
        templateId: tmpl.id,
        templateType: tmpl.templateType,
        title: request.title,
        filePath: result.filePath,
        year,
        month
      })
    })
    .run()

  return {
    id: docId,
    templateId: tmpl.id,
    documentType: tmpl.templateType,
    title: request.title,
    personnelIds: null,
    filePath: result.filePath,
    generatedAt: new Date().toISOString()
  }
}

/**
 * v1.6.0/v1.6.1: Special-case generator для шаблону templateType='docx_disposition'.
 *
 * v1.6.1: BR командира 4 ШБ читається з зовнішнього xlsx-довідника
 * BR_BAT_XLSX_PATH (=`D:\Project_CRM\BR_4ShB.xlsx`). UI більше не питає
 * brBatNumber/brBatDate — це завжди lookup-by-date.
 *
 * Single-day режим (RangePicker [today, today]):
 *   request.fields = { executionDateFrom: ISO, executionDateTo: <same> }
 *   → showSaveDialog. Якщо для дати немає запису у xlsx — throw error.
 *
 * Period режим (RangePicker [from, to], to > from):
 *   request.fields = { executionDateFrom: ISO, executionDateTo: ISO }
 *   → showOpenDialog для папки. Loop по днях, lookup у xlsx; якщо немає —
 *   skip і додаємо до `skippedDays`. Multi-BR на день об'єднуються через
 *   `; ` (formatBrNumbers).
 *
 * v1.6.0 backward compat: legacy `executionDate` (single field) ще
 * приймається як аліас для From=To.
 */
export async function generateDispositionDocument(
  request: GenerateDocumentRequest
): Promise<GeneratedDocument | BatchGenerationResult | { canceled: true }> {
  const db = getDatabase()

  const tmpl = db
    .select()
    .from(documentTemplates)
    .where(eq(documentTemplates.id, request.templateId))
    .get() as DocumentTemplate | undefined

  if (!tmpl) throw new Error(`Template not found: ${request.templateId}`)
  if (tmpl.templateType !== 'docx_disposition') {
    throw new Error(`Expected docx_disposition template, got: ${tmpl.templateType}`)
  }
  if (!existsSync(tmpl.filePath)) {
    throw new Error(`Template file not found: ${tmpl.filePath}`)
  }

  // Період — обов'язково з v1.6.1; backward compat для legacy executionDate.
  const isoFrom =
    request.fields?.executionDateFrom ?? request.fields?.executionDate ?? ''
  const isoTo =
    request.fields?.executionDateTo ?? request.fields?.executionDate ?? ''

  const dateRe = /^(\d{4})-(\d{2})-(\d{2})$/
  const mFrom = isoFrom.match(dateRe)
  const mTo = isoTo.match(dateRe)
  if (!mFrom || !mTo) {
    throw new Error(
      `Invalid executionDateFrom/To (expected YYYY-MM-DD): ${isoFrom} / ${isoTo}`
    )
  }
  const dateFrom = new Date(
    parseInt(mFrom[1], 10),
    parseInt(mFrom[2], 10) - 1,
    parseInt(mFrom[3], 10)
  )
  const dateTo = new Date(
    parseInt(mTo[1], 10),
    parseInt(mTo[2], 10) - 1,
    parseInt(mTo[3], 10)
  )
  if (dateFrom.getTime() > dateTo.getTime()) {
    throw new Error('executionDateFrom must be ≤ executionDateTo')
  }

  // Lookup-by-date з зовнішнього xlsx (один раз на запит — для single і period).
  const brBatMap = parseBrBatXlsx(BR_BAT_XLSX_PATH)
  if (brBatMap.size === 0) {
    throw new Error(
      `Не вдалося прочитати ${BR_BAT_XLSX_PATH} (файл відсутній або порожній)`
    )
  }

  // Single-day режим (період = 1 день): showSaveDialog, з xlsx-lookup.
  // Якщо в xlsx немає запису для дати — throw error (UI покаже повідомлення;
  // юзер додає рядок у BR_4ShB.xlsx і повторює).
  if (isoFrom === isoTo) {
    const entry = brBatMap.get(isoFrom)
    if (!entry) {
      throw new Error(
        `У BR_4ShB.xlsx немає запису для дати ${isoFrom.split('-').reverse().join('.')}. Додай рядок у файл і повтори.`
      )
    }
    const result = await buildDispositionReport(
      dateFrom,
      formatBrNumbers(entry),
      entry.date,
      tmpl.filePath
    )
    if (!result.success || !result.filePath) {
      return { canceled: true }
    }

    const dbResult = db
      .insert(generatedDocuments)
      .values({
        templateId: tmpl.id,
        documentType: tmpl.templateType,
        title: request.title,
        personnelIds: null,
        filePath: result.filePath
      })
      .run()
    const docId = Number(dbResult.lastInsertRowid)

    db.insert(auditLog)
      .values({
        tableName: 'generated_documents',
        recordId: docId,
        action: 'generate',
        newValues: JSON.stringify({
          templateId: tmpl.id,
          templateType: tmpl.templateType,
          title: request.title,
          filePath: result.filePath,
          executionDate: isoFrom,
          brBatNumber: formatBrNumbers(entry),
          brBatDate: entry.date
        })
      })
      .run()

    return {
      id: docId,
      templateId: tmpl.id,
      documentType: tmpl.templateType,
      title: request.title,
      personnelIds: null,
      filePath: result.filePath,
      generatedAt: new Date().toISOString()
    }
  }

  // Period режим: showOpenDialog для папки + loop.
  const folderResult = await dialog.showOpenDialog({
    title: 'Оберіть папку для збереження пакета БР',
    properties: ['openDirectory', 'createDirectory']
  })
  if (folderResult.canceled || folderResult.filePaths.length === 0) {
    return { canceled: true }
  }
  const dirPath = folderResult.filePaths[0]

  const skippedDays: string[] = []
  const ids: number[] = []

  for (
    let cursor = new Date(dateFrom);
    cursor.getTime() <= dateTo.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const yyyy = cursor.getFullYear()
    const mm = String(cursor.getMonth() + 1).padStart(2, '0')
    const dd = String(cursor.getDate()).padStart(2, '0')
    const isoCursor = `${yyyy}-${mm}-${dd}`

    const entry = brBatMap.get(isoCursor)
    if (!entry) {
      skippedDays.push(isoCursor)
      continue
    }

    const rendered = renderDispositionBuffer(
      new Date(cursor),
      formatBrNumbers(entry),
      entry.date,
      tmpl.filePath
    )
    const filename = buildDispositionFilename(rendered)
    const filePath = join(dirPath, filename)
    writeFileSync(filePath, rendered.buffer)

    const dbResult = db
      .insert(generatedDocuments)
      .values({
        templateId: tmpl.id,
        documentType: tmpl.templateType,
        title: `${request.title} — ${dd}.${mm}.${yyyy}`,
        personnelIds: null,
        filePath
      })
      .run()
    const docId = Number(dbResult.lastInsertRowid)
    ids.push(docId)

    db.insert(auditLog)
      .values({
        tableName: 'generated_documents',
        recordId: docId,
        action: 'generate',
        newValues: JSON.stringify({
          templateId: tmpl.id,
          templateType: tmpl.templateType,
          title: request.title,
          filePath,
          executionDate: isoCursor,
          brBatNumber: formatBrNumbers(entry),
          brBatDate: entry.date,
          batch: true
        })
      })
      .run()
  }

  return {
    type: 'batch',
    count: ids.length,
    skippedDays,
    dirPath,
    ids
  }
}

// ==================== ARCHIVE ====================

/**
 * List generated documents with optional filters
 */
export function listGeneratedDocuments(
  filters?: DocumentListFilters
): GeneratedDocumentListItem[] {
  const db = getDatabase()

  // Get all templates for name lookup
  const templates = db.select().from(documentTemplates).all()
  const templateMap = new Map(templates.map((t) => [t.id, t.name]))

  let rows = db
    .select()
    .from(generatedDocuments)
    .orderBy(desc(generatedDocuments.generatedAt))
    .all() as GeneratedDocument[]

  // Filter by type
  if (filters?.documentType) {
    rows = rows.filter((r) => r.documentType === filters.documentType)
  }

  // Filter by search
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    rows = rows.filter(
      (r) =>
        (r.title ?? '').toLowerCase().includes(q) ||
        r.documentType.toLowerCase().includes(q)
    )
  }

  return rows.map((r) => ({
    ...r,
    templateName: r.templateId ? templateMap.get(r.templateId) ?? undefined : undefined
  }))
}

/**
 * Open document file in default application
 */
export async function openDocument(filePath: string): Promise<void> {
  await shell.openPath(filePath)
}

/**
 * Delete generated document (file + DB record)
 */
export function deleteGeneratedDocument(id: number): { success: boolean } {
  const db = getDatabase()

  const doc = db
    .select()
    .from(generatedDocuments)
    .where(eq(generatedDocuments.id, id))
    .get() as GeneratedDocument | undefined

  if (!doc) return { success: false }

  // Delete file
  try {
    if (existsSync(doc.filePath)) {
      unlinkSync(doc.filePath)
    }
  } catch {
    // file may already be deleted
  }

  // Delete DB record
  db.delete(generatedDocuments).where(eq(generatedDocuments.id, id)).run()

  // Audit
  db.insert(auditLog)
    .values({
      tableName: 'generated_documents',
      recordId: id,
      action: 'delete',
      oldValues: JSON.stringify({ title: doc.title, filePath: doc.filePath })
    })
    .run()

  return { success: true }
}
