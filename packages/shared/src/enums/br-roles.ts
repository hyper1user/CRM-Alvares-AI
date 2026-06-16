/**
 * BR (Бойові розпорядження) ролі — 15 фіксованих позицій у Розпорядженні.
 *
 * v1.6.0: TS-port з Alvares-AI/core/br_roles.py + data/database.py:DEFAULT_ROLES.
 * Ролі — фіксовані (як STATUS_GROUP_NAMES у v1.2.0), бо кожна прив'язана
 * до конкретного docxtemplater-плейсхолдера у шаблоні Розпорядження
 * (`{{ROLE_ZKR}}` тощо). Юзер не може створити нову роль — інакше
 * шаблон не знатиме куди її вставити.
 *
 * Юзер може:
 *   * Призначити бійцю одну з 15 ролей через `/settings/br-roles` (v1.6.1).
 *   * Або auto-assign за ключовими словами в позиції — `autoAssignRole()`.
 *
 * `placeholderTag` — точний ім'я тегу у docxtemplater-шаблоні (без
 * delimiters). Контракт між цим довідником і шаблоном.
 */

export interface BrRole {
  id: number
  name: string
  /** Тег у docxtemplater (без `{{` / `}}`). Має 1-в-1 збігатися з шаблоном. */
  placeholderTag: string
}

export const BR_ROLES: BrRole[] = [
  { id: 1, name: 'Заступник командира роти', placeholderTag: 'ROLE_ZKR' },
  { id: 2, name: 'Офіцер з МПЗ', placeholderTag: 'ROLE_PPP' },
  { id: 3, name: 'Старший технік роти', placeholderTag: 'ROLE_SENIOR_TECH' },
  { id: 4, name: 'Головний сержант роти', placeholderTag: 'ROLE_FIRST_SERGEANT' },
  { id: 5, name: 'Сержант із матеріального забезпечення', placeholderTag: 'ROLE_SUPPLY_SERGEANT' },
  { id: 6, name: 'Старший бойовий медик', placeholderTag: 'ROLE_MEDIC' },
  { id: 7, name: 'Група евакуації', placeholderTag: 'ROLE_EVAC_GROUP' },
  { id: 8, name: 'Водій групи евакуації', placeholderTag: 'ROLE_EVAC_DRIVER' },
  { id: 9, name: 'Екіпажі розрахунків БМП-1ЛБ', placeholderTag: 'ROLE_BMP_CREWS' },
  { id: 10, name: 'Командири штурмових взводів', placeholderTag: 'ROLE_VZVOD' },
  { id: 11, name: 'Водії роти', placeholderTag: 'ROLE_DRIVERS' },
  { id: 12, name: "Чергові зв'язківці", placeholderTag: 'ROLE_SIGNAL' },
  { id: 13, name: 'Резервні групи', placeholderTag: 'ROLE_RESERVE' },
  { id: 14, name: 'Супровід FPV', placeholderTag: 'ROLE_FPV_ESCORT' },
  { id: 15, name: 'Водії логістики', placeholderTag: 'ROLE_LOGISTICS_DRIVERS' }
]

export const BR_ROLE_NAMES = BR_ROLES.map((r) => r.name)
export const BR_ROLE_BY_NAME = new Map(BR_ROLES.map((r) => [r.name, r]))
export const BR_ROLE_BY_TAG = new Map(BR_ROLES.map((r) => [r.placeholderTag, r]))

/**
 * Auto-assign ролі за ключовими словами в назві посади.
 *
 * Логіка 1-в-1 з Alvares-AI/core/br_roles.py:auto_assign_role.
 * Повертає null якщо жодне правило не спрацювало — такі ОС у шаблоні
 * лягають у "Резервні групи" (диспозиція тяжіє до non-empty cells).
 *
 * Порядок правил має значення: специфічніші раніше за загальніші
 * (наприклад «командир взводу» раніше за просто «командир»).
 */
export function autoAssignRole(position: string): string | null {
  const pos = position.toLowerCase().trim()
  if (!pos) return null

  // Заступник командира роти — специфічний, перш ніж загальний «командир»
  if (pos.includes('заступник') && pos.includes('командир')) {
    return 'Заступник командира роти'
  }

  // Офіцер з МПЗ (морально-психологічне забезпечення)
  if (pos.includes('мпз') || (pos.includes('морально') && pos.includes('псих'))) {
    return 'Офіцер з МПЗ'
  }

  // Медик
  if (pos.includes('медик') || pos.includes('медичн') || pos.includes('санітар')) {
    return 'Старший бойовий медик'
  }

  // Командир взводу — специфічний, перш ніж загальний «водій» (водій взводу теж є)
  if (pos.includes('командир') && pos.includes('взвод')) {
    return 'Командири штурмових взводів'
  }

  const hasEvak = pos.includes('евак')
  // Apostroph-варіанти: U+0027 (') vs U+02BC (ʼ) у «водiй»/«водій»
  const hasVodiy = pos.includes('водій') || pos.includes('водiй') || pos.includes('водій')

  if (hasEvak && hasVodiy) return 'Водій групи евакуації'
  if (hasEvak) return 'Група евакуації'

  // Перевіряємо «головний сержант» ДО простого «водій»
  if (pos.includes('головний сержант')) return 'Головний сержант роти'
  if (pos.includes('матеріаль')) return 'Сержант із матеріального забезпечення'

  if (hasVodiy) return 'Водії роти'

  if (pos.includes('fpv')) return 'Супровід FPV'
  if (pos.includes('логістик')) return 'Водії логістики'

  // Решта — keyword map (порядок не критичний, бо ключові слова не перетинаються)
  // Apostroph-варіанти для «зв'язківці» через окремий includes.
  if (pos.includes("зв'яз") || pos.includes('звʼяз') || pos.includes('звяз')) return "Чергові зв'язківці"
  if (pos.includes('технік')) return 'Старший технік роти'
  if (pos.includes('бмп')) return 'Екіпажі розрахунків БМП-1ЛБ'

  return null
}
