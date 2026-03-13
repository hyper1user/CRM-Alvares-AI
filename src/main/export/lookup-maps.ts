/**
 * Build reverse lookup maps (id → name) for export
 */
import { getDatabase } from '../db/connection'
import {
  ranks,
  subdivisions,
  bloodTypes,
  contractTypes,
  educationLevels,
  tccOffices
} from '../db/schema'

export interface ReverseLookupMaps {
  rankIdToName: Map<number, string>
  rankIdToCategory: Map<number, string>
  subdivisionIdToCode: Map<number, string>
  subdivisionIdToName: Map<number, string>
  bloodTypeIdToName: Map<number, string>
  contractTypeIdToName: Map<number, string>
  educationLevelIdToName: Map<number, string>
  tccIdToName: Map<number, string>
}

export function buildReverseLookupMaps(): ReverseLookupMaps {
  const db = getDatabase()

  const rankIdToName = new Map<number, string>()
  const rankIdToCategory = new Map<number, string>()
  for (const r of db.select().from(ranks).all()) {
    rankIdToName.set(r.id, r.name)
    rankIdToCategory.set(r.id, r.category)
  }

  const subdivisionIdToCode = new Map<number, string>()
  const subdivisionIdToName = new Map<number, string>()
  for (const s of db.select().from(subdivisions).all()) {
    subdivisionIdToCode.set(s.id, s.code)
    subdivisionIdToName.set(s.id, s.name)
  }

  const bloodTypeIdToName = new Map<number, string>()
  for (const b of db.select().from(bloodTypes).all()) {
    bloodTypeIdToName.set(b.id, b.name)
  }

  const contractTypeIdToName = new Map<number, string>()
  for (const c of db.select().from(contractTypes).all()) {
    contractTypeIdToName.set(c.id, c.name)
  }

  const educationLevelIdToName = new Map<number, string>()
  for (const e of db.select().from(educationLevels).all()) {
    educationLevelIdToName.set(e.id, e.name)
  }

  const tccIdToName = new Map<number, string>()
  for (const t of db.select().from(tccOffices).all()) {
    tccIdToName.set(t.id, t.name)
  }

  return {
    rankIdToName,
    rankIdToCategory,
    subdivisionIdToCode,
    subdivisionIdToName,
    bloodTypeIdToName,
    contractTypeIdToName,
    educationLevelIdToName,
    tccIdToName
  }
}
