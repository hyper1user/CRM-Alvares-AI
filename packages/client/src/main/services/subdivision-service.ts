import { asc, eq } from 'drizzle-orm'
import { personnel, positions, subdivisions } from '@shared/db/schema'
import { getDatabase } from '../db/connection'

export function getSubdivisionsTree(): unknown[] {
  const db = getDatabase()

  const allSubs = db.select().from(subdivisions).orderBy(asc(subdivisions.sortOrder)).all()
  const allPositions = db.select().from(positions).where(eq(positions.isActive, true)).all()
  const activePersonnel = db
    .select({
      id: personnel.id,
      currentSubdivision: personnel.currentSubdivision,
      currentPositionIdx: personnel.currentPositionIdx
    })
    .from(personnel)
    .where(eq(personnel.status, 'active'))
    .all()

  const posCountBySubId = new Map<number, number>()
  for (const p of allPositions) {
    posCountBySubId.set(p.subdivisionId, (posCountBySubId.get(p.subdivisionId) || 0) + 1)
  }

  const persCountByCode = new Map<string, number>()
  for (const p of activePersonnel) {
    if (p.currentSubdivision) {
      persCountByCode.set(p.currentSubdivision, (persCountByCode.get(p.currentSubdivision) || 0) + 1)
    }
  }

  const occupiedPosIdx = new Set(activePersonnel.map((p) => p.currentPositionIdx).filter(Boolean))
  const occupiedBySubId = new Map<number, number>()
  for (const p of allPositions) {
    if (occupiedPosIdx.has(p.positionIndex)) {
      occupiedBySubId.set(p.subdivisionId, (occupiedBySubId.get(p.subdivisionId) || 0) + 1)
    }
  }

  type TreeNode = typeof allSubs[0] & {
    children: TreeNode[]
    personnelCount: number
    positionCount: number
    vacantCount: number
  }

  const nodes: TreeNode[] = allSubs.map((s) => {
    const posCount = posCountBySubId.get(s.id) || 0
    const persCount = persCountByCode.get(s.code) || 0
    const occupiedCount = occupiedBySubId.get(s.id) || 0
    return {
      ...s,
      children: [],
      personnelCount: persCount,
      positionCount: posCount,
      vacantCount: posCount - occupiedCount
    }
  })

  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const roots: TreeNode[] = []

  for (const node of nodes) {
    if (node.parentId && nodeById.has(node.parentId)) {
      nodeById.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function updateSubdivision(id: number, data: Record<string, unknown>): unknown {
  const db = getDatabase()
  const updates: Record<string, unknown> = {}

  if (data.name !== undefined) updates.name = data.name
  if (data.fullName !== undefined) updates.fullName = data.fullName
  if (data.isActive !== undefined) updates.isActive = data.isActive

  db.update(subdivisions)
    .set(updates as Partial<typeof subdivisions.$inferInsert>)
    .where(eq(subdivisions.id, id))
    .run()

  return db.select().from(subdivisions).where(eq(subdivisions.id, id)).get()
}

export function listSubdivisions(): unknown[] {
  const db = getDatabase()
  return db.select().from(subdivisions).all()
}
