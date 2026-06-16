import { and, asc, eq } from 'drizzle-orm'
import { auditLog, personnel, positions, ranks, subdivisions } from '@shared/db/schema'
import { positionCreateSchema, positionUpdateSchema } from '@shared/validators'
import { getDatabase } from '../db/connection'

export interface PositionFilters {
  subdivisionId?: number
  isActive?: boolean
  search?: string
  occupancy?: 'all' | 'occupied' | 'vacant' | 'deactivated'
}

export function listPositions(filters?: PositionFilters): unknown[] {
  const db = getDatabase()

  const allPos = db
    .select({
      id: positions.id,
      positionIndex: positions.positionIndex,
      subdivisionId: positions.subdivisionId,
      title: positions.title,
      detail: positions.detail,
      fullTitle: positions.fullTitle,
      rankRequired: positions.rankRequired,
      specialtyCode: positions.specialtyCode,
      tariffGrade: positions.tariffGrade,
      staffNumber: positions.staffNumber,
      isActive: positions.isActive,
      notes: positions.notes,
      subdivisionCode: subdivisions.code,
      subdivisionName: subdivisions.name
    })
    .from(positions)
    .leftJoin(subdivisions, eq(positions.subdivisionId, subdivisions.id))
    .orderBy(asc(positions.positionIndex))
    .all()

  const activePersonnel = db
    .select({
      id: personnel.id,
      fullName: personnel.fullName,
      rankName: ranks.name,
      currentPositionIdx: personnel.currentPositionIdx
    })
    .from(personnel)
    .leftJoin(ranks, eq(personnel.rankId, ranks.id))
    .where(eq(personnel.status, 'active'))
    .all()

  const personnelByPos = new Map<string, { id: number; fullName: string; rankName: string | null }>()
  for (const p of activePersonnel) {
    if (p.currentPositionIdx) {
      personnelByPos.set(p.currentPositionIdx, {
        id: p.id,
        fullName: p.fullName,
        rankName: p.rankName
      })
    }
  }

  let result = allPos.map((pos) => {
    const occupant = personnelByPos.get(pos.positionIndex)
    return {
      ...pos,
      occupantId: occupant?.id ?? null,
      occupantName: occupant?.fullName ?? null,
      occupantRank: occupant?.rankName ?? null
    }
  })

  if (filters?.subdivisionId) {
    result = result.filter((p) => p.subdivisionId === filters.subdivisionId)
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.positionIndex.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.occupantName && p.occupantName.toLowerCase().includes(q))
    )
  }

  if (filters?.occupancy === 'occupied') {
    result = result.filter((p) => p.isActive && p.occupantId !== null)
  } else if (filters?.occupancy === 'vacant') {
    result = result.filter((p) => p.isActive && p.occupantId === null)
  } else if (filters?.occupancy === 'deactivated') {
    result = result.filter((p) => !p.isActive)
  } else if (filters?.isActive !== undefined) {
    result = result.filter((p) => p.isActive === filters.isActive)
  }

  return result
}

export function getPosition(id: number): unknown | null {
  const db = getDatabase()

  const pos = db
    .select({
      id: positions.id,
      positionIndex: positions.positionIndex,
      subdivisionId: positions.subdivisionId,
      title: positions.title,
      detail: positions.detail,
      fullTitle: positions.fullTitle,
      rankRequired: positions.rankRequired,
      specialtyCode: positions.specialtyCode,
      tariffGrade: positions.tariffGrade,
      staffNumber: positions.staffNumber,
      isActive: positions.isActive,
      notes: positions.notes,
      subdivisionCode: subdivisions.code,
      subdivisionName: subdivisions.name
    })
    .from(positions)
    .leftJoin(subdivisions, eq(positions.subdivisionId, subdivisions.id))
    .where(eq(positions.id, id))
    .get()

  if (!pos) return null

  const occupant = db
    .select({
      id: personnel.id,
      fullName: personnel.fullName,
      rankName: ranks.name
    })
    .from(personnel)
    .leftJoin(ranks, eq(personnel.rankId, ranks.id))
    .where(and(eq(personnel.currentPositionIdx, pos.positionIndex), eq(personnel.status, 'active')))
    .get()

  return {
    ...pos,
    occupantId: occupant?.id ?? null,
    occupantName: occupant?.fullName ?? null,
    occupantRank: occupant?.rankName ?? null
  }
}

export function createPosition(data: Record<string, unknown>): unknown {
  const parsed = positionCreateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: true, issues: parsed.error.issues }
  }

  const db = getDatabase()
  const input = parsed.data
  const cleaned: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    cleaned[key] = value === '' ? null : value
  }

  const result = db
    .insert(positions)
    .values(cleaned as typeof positions.$inferInsert)
    .returning()
    .get()

  db.insert(auditLog)
    .values({
      tableName: 'positions',
      recordId: result.id,
      action: 'create',
      newValues: JSON.stringify(cleaned)
    })
    .run()

  return result
}

export function updatePosition(id: number, data: Record<string, unknown>): unknown {
  const parsed = positionUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: true, issues: parsed.error.issues }
  }

  const db = getDatabase()
  const input = parsed.data
  const updates: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    updates[key] = value === '' ? null : value
  }

  const oldRow = db.select().from(positions).where(eq(positions.id, id)).get()

  db.update(positions)
    .set(updates as Partial<typeof positions.$inferInsert>)
    .where(eq(positions.id, id))
    .run()

  db.insert(auditLog)
    .values({
      tableName: 'positions',
      recordId: id,
      action: 'update',
      oldValues: JSON.stringify(oldRow),
      newValues: JSON.stringify(updates)
    })
    .run()

  return db.select().from(positions).where(eq(positions.id, id)).get()
}
