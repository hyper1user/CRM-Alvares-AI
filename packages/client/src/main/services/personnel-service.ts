import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm'
import {
  auditLog,
  educationLevels,
  personnel,
  positions,
  ranks,
  statusTypes,
  tccOffices
} from '@shared/db/schema'
import { personnelCreateSchema, personnelUpdateSchema } from '@shared/validators'
import { getDatabase } from '../db/connection'

export interface PersonnelFilters {
  search?: string
  subdivision?: string
  statusCode?: string
  category?: string
  status?: string
}

export interface PersonnelBrRoleUpdate {
  personnelId: number
  brRole: string | null
}

export function listPersonnel(filters?: PersonnelFilters): unknown[] {
  const db = getDatabase()
  const conditions: ReturnType<typeof eq>[] = []

  const statusFilter = filters?.status || 'active'
  conditions.push(eq(personnel.status, statusFilter))

  if (filters?.subdivision) {
    conditions.push(eq(personnel.currentSubdivision, filters.subdivision))
  }

  if (filters?.statusCode) {
    conditions.push(eq(personnel.currentStatusCode, filters.statusCode))
  }

  if (filters?.search) {
    const pattern = `%${filters.search}%`
    conditions.push(
      or(
        like(personnel.fullName, pattern),
        like(personnel.ipn, pattern),
        like(personnel.callsign, pattern)
      )!
    )
  }

  const primarySort =
    statusFilter === 'excluded' ? desc(personnel.excludedAt) : asc(personnel.currentPositionIdx)

  const result = db
    .select({
      id: personnel.id,
      ipn: personnel.ipn,
      fullName: personnel.fullName,
      rankName: ranks.name,
      rankCategory: ranks.category,
      callsign: personnel.callsign,
      currentPositionIdx: personnel.currentPositionIdx,
      currentStatusCode: personnel.currentStatusCode,
      currentSubdivision: personnel.currentSubdivision,
      phone: personnel.phone,
      status: personnel.status,
      excludedAt: personnel.excludedAt,
      brRole: personnel.brRole
    })
    .from(personnel)
    .leftJoin(ranks, eq(personnel.rankId, ranks.id))
    .where(and(...conditions))
    .orderBy(primarySort, asc(personnel.fullName))
    .all()

  const positionRows = db.select().from(positions).all()
  const posMap = new Map(positionRows.map((p) => [p.positionIndex, p.title]))

  const statusRows = db.select().from(statusTypes).all()
  const statusMap = new Map(statusRows.map((s) => [s.code, s.name]))

  let enriched = result.map((row) => ({
    ...row,
    positionTitle: row.currentPositionIdx ? (posMap.get(row.currentPositionIdx) ?? null) : null,
    statusName: row.currentStatusCode ? (statusMap.get(row.currentStatusCode) ?? null) : null
  }))

  if (filters?.category) {
    enriched = enriched.filter((r) => r.rankCategory === filters.category)
  }

  return enriched
}

export function getPersonnel(id: number): unknown | null {
  const db = getDatabase()

  const row = db.select().from(personnel).where(eq(personnel.id, id)).get()
  if (!row) return null

  let rankName: string | null = null
  let rankCategory: string | null = null
  if (row.rankId) {
    const rank = db.select().from(ranks).where(eq(ranks.id, row.rankId)).get()
    if (rank) {
      rankName = rank.name
      rankCategory = rank.category
    }
  }

  let positionTitle: string | null = null
  if (row.currentPositionIdx) {
    const pos = db
      .select()
      .from(positions)
      .where(eq(positions.positionIndex, row.currentPositionIdx))
      .get()
    if (pos) positionTitle = pos.title
  }

  let statusName: string | null = null
  let statusColorCode: string | null = null
  if (row.currentStatusCode) {
    const st = db
      .select()
      .from(statusTypes)
      .where(eq(statusTypes.code, row.currentStatusCode))
      .get()
    if (st) {
      statusName = st.name
      statusColorCode = st.colorCode ?? null
    }
  }

  let educationLevelName: string | null = null
  if (row.educationLevelId) {
    const el = db
      .select()
      .from(educationLevels)
      .where(eq(educationLevels.id, row.educationLevelId))
      .get()
    if (el) educationLevelName = el.name
  }

  let tccName: string | null = null
  if (row.tccId) {
    const tcc = db.select().from(tccOffices).where(eq(tccOffices.id, row.tccId)).get()
    if (tcc) tccName = tcc.name
  }

  return {
    ...row,
    rankName,
    rankCategory,
    positionTitle,
    statusName,
    statusColorCode,
    educationLevelName,
    tccName
  }
}

export function createPersonnel(data: Record<string, unknown>): unknown {
  const parsed = personnelCreateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: true, issues: parsed.error.issues }
  }

  const db = getDatabase()
  const input = parsed.data
  const fullName = [input.lastName, input.firstName, input.patronymic].filter(Boolean).join(' ')
  const cleaned: Record<string, unknown> = { fullName }

  for (const [key, value] of Object.entries(input)) {
    cleaned[key] = value === '' ? null : value
  }

  const result = db
    .insert(personnel)
    .values(cleaned as typeof personnel.$inferInsert)
    .returning()
    .get()

  db.insert(auditLog)
    .values({
      tableName: 'personnel',
      recordId: result.id,
      action: 'create',
      newValues: JSON.stringify(cleaned)
    })
    .run()

  return result
}

export function updatePersonnel(id: number, data: Record<string, unknown>): unknown {
  const parsed = personnelUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: true, issues: parsed.error.issues }
  }

  const db = getDatabase()
  const input = parsed.data
  const updates: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    updates[key] = value === '' ? null : value
  }

  if (input.lastName || input.firstName || input.patronymic) {
    const existing = db.select().from(personnel).where(eq(personnel.id, id)).get()
    if (existing) {
      const lastName = input.lastName || existing.lastName
      const firstName = input.firstName || existing.firstName
      const patronymic = input.patronymic !== undefined ? input.patronymic : existing.patronymic
      updates.fullName = [lastName, firstName, patronymic].filter(Boolean).join(' ')
    }
  }

  updates.updatedAt = sql`datetime('now')`

  const oldRow = db.select().from(personnel).where(eq(personnel.id, id)).get()
  if (input.status === 'active' && oldRow?.status === 'excluded') {
    updates.excludedAt = null
  }

  db.update(personnel)
    .set(updates as Partial<typeof personnel.$inferInsert>)
    .where(eq(personnel.id, id))
    .run()

  db.insert(auditLog)
    .values({
      tableName: 'personnel',
      recordId: id,
      action: 'update',
      oldValues: JSON.stringify(oldRow),
      newValues: JSON.stringify(updates)
    })
    .run()

  return db.select().from(personnel).where(eq(personnel.id, id)).get()
}

export function deletePersonnel(id: number): { ok: true } {
  const db = getDatabase()

  db.update(personnel)
    .set({
      status: 'excluded',
      excludedAt: sql`datetime('now')`,
      updatedAt: sql`datetime('now')`
    })
    .where(eq(personnel.id, id))
    .run()

  db.insert(auditLog)
    .values({
      tableName: 'personnel',
      recordId: id,
      action: 'soft_delete',
      newValues: JSON.stringify({ status: 'excluded' })
    })
    .run()

  return { ok: true }
}

export function bulkSetPersonnelBrRoles(
  items: PersonnelBrRoleUpdate[]
): { ok: true; updated: number } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: true, updated: 0 }
  }

  const db = getDatabase()
  let updated = 0

  db.transaction(() => {
    for (const it of items) {
      const res = db
        .update(personnel)
        .set({ brRole: it.brRole ?? null, updatedAt: sql`datetime('now')` })
        .where(eq(personnel.id, it.personnelId))
        .run()
      updated += res.changes
    }
  })

  db.insert(auditLog)
    .values({
      tableName: 'personnel',
      recordId: 0,
      action: 'br_roles_bulk_set',
      newValues: JSON.stringify({ count: items.length, updated })
    })
    .run()

  return { ok: true, updated }
}

export function searchPersonnel(query: string): unknown[] {
  const db = getDatabase()
  const q = (query ?? '').toLowerCase().trim()
  if (!q) return []

  const allActive = db
    .select({
      id: personnel.id,
      ipn: personnel.ipn,
      fullName: personnel.fullName,
      rankName: ranks.name,
      rankCategory: ranks.category,
      callsign: personnel.callsign,
      currentPositionIdx: personnel.currentPositionIdx,
      currentStatusCode: personnel.currentStatusCode,
      currentSubdivision: personnel.currentSubdivision,
      phone: personnel.phone,
      status: personnel.status
    })
    .from(personnel)
    .leftJoin(ranks, eq(personnel.rankId, ranks.id))
    .where(eq(personnel.status, 'active'))
    .orderBy(asc(personnel.currentPositionIdx), asc(personnel.fullName))
    .all()

  return allActive.filter((p) => {
    const fullName = (p.fullName ?? '').toLowerCase()
    const ipn = (p.ipn ?? '').toLowerCase()
    const callsign = (p.callsign ?? '').toLowerCase()
    return fullName.includes(q) || ipn.includes(q) || callsign.includes(q)
  })
}
