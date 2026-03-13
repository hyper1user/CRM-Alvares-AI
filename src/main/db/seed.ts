import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import {
  ranks,
  statusTypes,
  subdivisions,
  bloodTypes,
  contractTypes,
  educationLevels,
  orderIssuers,
  movementOrderTypes,
  exclusionReasons,
  absenceReasons,
  lossTypes,
  settings
} from './schema'
import { RANKS } from '@shared/enums/ranks'
import { STATUS_TYPES } from '@shared/enums/status-codes'
import {
  BLOOD_TYPES,
  CONTRACT_TYPES,
  EDUCATION_LEVELS,
  ORDER_ISSUERS,
  MOVEMENT_ORDER_TYPES,
  EXCLUSION_REASONS,
  ABSENCE_REASONS,
  LOSS_TYPES,
  SUBDIVISIONS
} from '@shared/enums/categories'
import { sql } from 'drizzle-orm'

export function seedDatabase(db: BetterSQLite3Database): void {
  // Перевіряємо чи БД вже заповнена
  const existing = db.select().from(ranks).limit(1).all()
  if (existing.length > 0) return

  console.log('[seed] Заповнення довідників...')

  // Звання (38 записів)
  for (const r of RANKS) {
    db.insert(ranks)
      .values({
        id: r.id,
        name: r.name,
        category: r.category,
        sortOrder: r.sortOrder,
        natoCode: r.natoCode ?? null
      })
      .run()
  }
  console.log(`[seed] ranks: ${RANKS.length} записів`)

  // Статуси (21 запис)
  for (const s of STATUS_TYPES) {
    db.insert(statusTypes)
      .values({
        id: s.id,
        code: s.code,
        name: s.name,
        groupName: s.groupName,
        onSupply: s.onSupply,
        rewardAmount: s.rewardAmount,
        sortOrder: s.sortOrder,
        colorCode: s.colorCode
      })
      .run()
  }
  console.log(`[seed] status_types: ${STATUS_TYPES.length} записів`)

  // Підрозділи (21 запис)
  for (const sub of SUBDIVISIONS) {
    db.insert(subdivisions)
      .values({
        code: sub.code,
        name: sub.name,
        fullName: sub.fullName,
        parentId: null,
        sortOrder: sub.sortOrder,
        isActive: true
      })
      .run()
  }
  console.log(`[seed] subdivisions: ${SUBDIVISIONS.length} записів`)

  // Групи крові (9 записів)
  for (const bt of BLOOD_TYPES) {
    db.insert(bloodTypes).values({ name: bt }).run()
  }
  console.log(`[seed] blood_types: ${BLOOD_TYPES.length} записів`)

  // Типи контрактів (10 записів)
  for (const ct of CONTRACT_TYPES) {
    db.insert(contractTypes)
      .values({ name: ct.name, months: ct.months, toDemob: ct.toDemob })
      .run()
  }
  console.log(`[seed] contract_types: ${CONTRACT_TYPES.length} записів`)

  // Рівні освіти (9 записів)
  for (const el of EDUCATION_LEVELS) {
    db.insert(educationLevels).values({ name: el }).run()
  }
  console.log(`[seed] education_levels: ${EDUCATION_LEVELS.length} записів`)

  // Джерела наказів (8 записів)
  for (const oi of ORDER_ISSUERS) {
    db.insert(orderIssuers).values({ name: oi }).run()
  }
  console.log(`[seed] order_issuers: ${ORDER_ISSUERS.length} записів`)

  // Типи наказів на переміщення (7 записів)
  for (const mot of MOVEMENT_ORDER_TYPES) {
    db.insert(movementOrderTypes).values({ name: mot }).run()
  }
  console.log(`[seed] movement_order_types: ${MOVEMENT_ORDER_TYPES.length} записів`)

  // Підстави виключення (9 записів)
  for (const er of EXCLUSION_REASONS) {
    db.insert(exclusionReasons).values({ name: er }).run()
  }
  console.log(`[seed] exclusion_reasons: ${EXCLUSION_REASONS.length} записів`)

  // Підстави вибуття (10 записів)
  for (const ar of ABSENCE_REASONS) {
    db.insert(absenceReasons).values({ name: ar }).run()
  }
  console.log(`[seed] absence_reasons: ${ABSENCE_REASONS.length} записів`)

  // Види втрат (5 записів)
  for (const lt of LOSS_TYPES) {
    db.insert(lossTypes).values({ name: lt }).run()
  }
  console.log(`[seed] loss_types: ${LOSS_TYPES.length} записів`)

  // Налаштування
  const defaultSettings = {
    unit_name: '12 ОШР "Хижаки"',
    unit_designation: 'в/ч А0501',
    parent_unit: '92 ОШБр ім. кошового отамана Івана Сірка',
    brigade_designation: 'в/ч А1314',
    staff_number: '53/711',
    position_index_prefix: 'Г03',
    commander_rank: 'капітан',
    commander_name: 'Красний Євген Геннадійович',
    date_format: 'DD.MM.YYYY'
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    db.insert(settings).values({ key, value }).run()
  }
  console.log(`[seed] settings: ${Object.keys(defaultSettings).length} записів`)

  console.log('[seed] Заповнення завершено!')
}
