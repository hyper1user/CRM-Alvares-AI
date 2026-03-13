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
  lines: string[]
}

const DEFAULT_TEMPLATES: TemplateDefinition[] = [
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
  }
]

// ==================== TEMPLATE MANAGEMENT ====================

/**
 * Seed default templates: create .docx files + insert DB records
 */
export function seedDefaultTemplates(): void {
  const db = getDatabase()
  const existing = db.select().from(documentTemplates).all()
  if (existing.length > 0) return

  console.log('[documents] Seeding default templates...')
  const templatesDir = getTemplatesDir()

  for (const def of DEFAULT_TEMPLATES) {
    const filePath = join(templatesDir, def.fileName)

    // Check if source template exists in resources/
    const resourcePath = getResourceTemplatePath(def.fileName)
    if (resourcePath && existsSync(resourcePath)) {
      copyFileSync(resourcePath, filePath)
    } else {
      // Generate minimal docx programmatically
      const buffer = createMinimalDocx(def.lines)
      writeFileSync(filePath, buffer)
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

  console.log(`[documents] Seeded ${DEFAULT_TEMPLATES.length} templates`)
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

  // Settings (unit info)
  const allSettings = db.select().from(settings).all()
  const settingsMap = new Map(allSettings.map((s) => [s.key, s.value]))
  data.unitName = settingsMap.get('unit_name') ?? ''
  data.unitDesignation = settingsMap.get('unit_designation') ?? ''
  data.commanderRank = settingsMap.get('commander_rank') ?? ''
  data.commanderName = settingsMap.get('commander_name') ?? ''

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
