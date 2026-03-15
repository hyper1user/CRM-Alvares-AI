/**
 * Document Service — template management, document generation, archive
 */
import { app, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, copyFileSync, unlinkSync } from 'fs'
import { getDatabase } from '../db/connection'
import { documentTemplates, generatedDocuments, settings, personnel, auditLog } from '../db/schema'
import { eq, desc, like, or } from 'drizzle-orm'
import { generateDocx, getTemplateTags, createMinimalDocx } from './docx-engine'
import type {
  DocumentTemplate,
  GeneratedDocument,
  GenerateDocumentRequest,
  GeneratedDocumentListItem,
  DocumentListFilters
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
  description: string
  fileName: string
  lines: string[] // fallback content if .docx file not in resources/
}

const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  // ==================== GENERATED (fallback) ====================
  {
    name: 'Наказ по ОС',
    templateType: 'order',
    description: 'Наказ командира по особовому складу',
    fileName: 'order-personnel.docx',
    lines: [
      'НАКАЗ',
      'Командира {unitName} ({unitDesignation})',
      'по особовому складу',
      '',
      '№ {orderNumber} від {orderDate}',
      '',
      '{subject}',
      '',
      '{body}',
      '',
      'Командир {unitDesignation}',
      '{commanderRank} {commanderName}'
    ]
  },
  {
    name: 'Відпускний квиток',
    templateType: 'leave_ticket',
    description: 'Відпускний квиток військовослужбовця',
    fileName: 'leave-ticket.docx',
    lines: [
      'ВІДПУСКНИЙ КВИТОК № {ticketNumber}',
      '',
      'Виданий: {rankName} {fullName}',
      'ІПН: {ipn}',
      'Посада: {positionTitle}',
      'Підрозділ: {subdivisionName}',
      '',
      'Тип відпустки: {leaveType}',
      'З: {startDate}   По: {endDate}',
      'Днів дороги: {travelDays}',
      'Пункт призначення: {destination}',
      '',
      'Наказ № {orderNumber} від {orderDate}',
      '',
      'Командир {unitDesignation}',
      '{commanderRank} {commanderName}'
    ]
  },
  {
    name: 'Довідка про поранення',
    templateType: 'injury_certificate',
    description: 'Довідка про обставини поранення (травми, контузії)',
    fileName: 'injury-certificate.docx',
    lines: [
      'ДОВІДКА',
      'про обставини поранення (травми, контузії)',
      '',
      '{rankName} {fullName}',
      'ІПН: {ipn}',
      '',
      'Вид поранення: {injuryType}',
      'Дата: {dateOfInjury}',
      'Місце: {location}',
      'Обставини: {circumstances}',
      '',
      'Форма 100 № {forma100Number} від {forma100Date}',
      'Медичний заклад: {hospitalName}',
      '',
      'Командир {unitDesignation}',
      '{commanderRank} {commanderName}'
    ]
  },

  // ==================== ДОПОВІДІ (reports) ====================
  {
    name: 'Доповідь 1×300',
    templateType: 'report',
    description: 'Доповідь про одиночне поранення (300)',
    fileName: 'report-300-single.docx',
    lines: []
  },
  {
    name: 'Доповідь 1×БТ',
    templateType: 'report',
    description: 'Доповідь про бойову травму (одиночна)',
    fileName: 'report-bt-single.docx',
    lines: []
  },
  {
    name: 'Доповідь 1×ЗБ',
    templateType: 'report',
    description: 'Доповідь про загибель (одиночна)',
    fileName: 'report-combat-loss-single.docx',
    lines: []
  },
  {
    name: 'Доповідь 200',
    templateType: 'report',
    description: 'Доповідь про безповоротну втрату (200)',
    fileName: 'report-200.docx',
    lines: []
  },
  {
    name: 'Доповідь 2+×300',
    templateType: 'report',
    description: 'Доповідь про множинні поранення (300)',
    fileName: 'report-300-multi.docx',
    lines: []
  },
  {
    name: 'Доповідь повернення (рез. бат.)',
    templateType: 'report',
    description: 'Доповідь про повернення з СЗЧ до резервного батальйону',
    fileName: 'report-return-reserve.docx',
    lines: []
  },
  {
    name: 'Доповідь повернення (підрозділ)',
    templateType: 'report',
    description: 'Доповідь про повернення з СЗЧ до підрозділу',
    fileName: 'report-return-unit.docx',
    lines: []
  },

  // ==================== ЗВІЛЬНЕННЯ (discharge) ====================
  {
    name: 'Звільнення — відпустка УБД',
    templateType: 'certificate',
    description: 'Звільнення: відпустка учасника бойових дій',
    fileName: 'discharge-leave-ubd.docx',
    lines: []
  },
  {
    name: 'Звільнення — здача посади',
    templateType: 'certificate',
    description: 'Звільнення: акт здачі-прийому посади',
    fileName: 'discharge-handover.docx',
    lines: []
  },
  {
    name: 'Звільнення — речове майно',
    templateType: 'certificate',
    description: 'Звільнення: виплата за неотримане речове майно',
    fileName: 'discharge-clothing.docx',
    lines: []
  },
  {
    name: 'Звільнення — направлення на облік',
    templateType: 'certificate',
    description: 'Звільнення: направлення на військовий облік',
    fileName: 'discharge-registration.docx',
    lines: []
  },
  {
    name: 'Звільнення — невикористана відпустка',
    templateType: 'certificate',
    description: 'Звільнення: компенсація невикористаної відпустки',
    fileName: 'discharge-unused-leave.docx',
    lines: []
  },
  {
    name: 'Звільнення — оздоровчі',
    templateType: 'certificate',
    description: 'Звільнення: оздоровчі виплати',
    fileName: 'discharge-health.docx',
    lines: []
  },
  {
    name: 'Звільнення — соціально-побутові',
    templateType: 'certificate',
    description: 'Звільнення: соціально-побутові виплати',
    fileName: 'discharge-social.docx',
    lines: []
  },

  // ==================== РАПОРТИ (raports) ====================
  {
    name: 'Рапорт 1×300',
    templateType: 'report',
    description: 'Рапорт про одиночне поранення (300)',
    fileName: 'raport-300-single.docx',
    lines: []
  },
  {
    name: 'Рапорт 1×ЗБ',
    templateType: 'report',
    description: 'Рапорт про загибель',
    fileName: 'raport-combat-loss.docx',
    lines: []
  },
  {
    name: 'Рапорт 200',
    templateType: 'report',
    description: 'Рапорт про безповоротну втрату (200)',
    fileName: 'raport-200.docx',
    lines: []
  },
  {
    name: 'Рапорт 2+×БТ',
    templateType: 'report',
    description: 'Рапорт про множинні бойові травми',
    fileName: 'raport-bt-multi.docx',
    lines: []
  },
  {
    name: 'Рапорт відпустка (за сімейними)',
    templateType: 'report',
    description: 'Рапорт на відпустку за сімейними обставинами',
    fileName: 'raport-leave-family.docx',
    lines: []
  },
  {
    name: 'Рапорт відпустка (основна)',
    templateType: 'report',
    description: 'Рапорт на основну щорічну відпустку',
    fileName: 'raport-leave-main.docx',
    lines: []
  },
  {
    name: 'Рапорт ВПХ',
    templateType: 'report',
    description: 'Рапорт на відпустку по хворобі',
    fileName: 'raport-leave-medical.docx',
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
    const filePath = join(templatesDir, def.fileName)

    // Check if source template exists in resources/
    const resourcePath = getResourceTemplatePath(def.fileName)
    if (resourcePath && existsSync(resourcePath)) {
      copyFileSync(resourcePath, filePath)
    } else if (def.lines.length > 0) {
      // Generate minimal docx programmatically (only for templates with content)
      const buffer = createMinimalDocx(def.lines)
      writeFileSync(filePath, buffer)
    } else {
      // No resource file and no fallback lines — skip this template
      console.warn(`[documents] Skipping template "${def.name}": no source file found`)
      continue
    }

    db.insert(documentTemplates)
      .values({
        name: def.name,
        templateType: def.templateType,
        filePath,
        description: def.description,
        isDefault: true
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
