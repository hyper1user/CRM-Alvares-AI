import { z } from 'zod'

/**
 * Валідація РНОКПП (ІПН) — 10 цифр з контрольною сумою
 * Алгоритм з ЕЖООС conditional formatting
 */
export function validateIpn(ipn: string): boolean {
  if (!/^\d{10}$/.test(ipn)) return false

  const d = ipn.split('').map(Number)
  const checksum =
    ((-1 * d[0] + 5 * d[1] + 7 * d[2] + 9 * d[3] + 4 * d[4] + 6 * d[5] + 10 * d[6] + 5 * d[7] + 7 * d[8]) % 11) % 10

  return checksum === d[9]
}

/**
 * Витягує дату народження з ІПН
 * Перші 5 цифр = кількість днів від 01.01.1900
 */
export function birthDateFromIpn(ipn: string): Date | null {
  if (!/^\d{10}$/.test(ipn)) return null

  const daysSince1900 = parseInt(ipn.substring(0, 5), 10)
  const date = new Date(1899, 11, 31)
  date.setDate(date.getDate() + daysSince1900)

  if (date.getFullYear() < 1900 || date.getFullYear() > 2020) return null
  return date
}

/**
 * Витягує стать з ІПН
 * 9-та цифра: парна = жінка, непарна = чоловік
 */
export function genderFromIpn(ipn: string): 'ч' | 'ж' | null {
  if (!/^\d{10}$/.test(ipn)) return null
  return parseInt(ipn[8], 10) % 2 === 0 ? 'ж' : 'ч'
}

// Zod schemas
export const ipnSchema = z.string().length(10).regex(/^\d{10}$/).refine(validateIpn, {
  message: 'Невірна контрольна сума ІПН'
})

export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]{7,20}$/).optional().or(z.literal(''))

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''))

// Personnel create/update schema
export const personnelCreateSchema = z.object({
  ipn: ipnSchema,
  lastName: z.string().min(1, 'Прізвище обов\'язкове'),
  firstName: z.string().min(1, 'Ім\'я обов\'язкове'),
  patronymic: z.string().optional().or(z.literal('')),
  callsign: z.string().optional().or(z.literal('')),
  phone: phoneSchema,
  dateOfBirth: dateSchema,
  gender: z.enum(['ч', 'ж']).optional().or(z.literal('')),

  // Service
  rankId: z.number().nullable().optional(),
  serviceType: z.string().optional().or(z.literal('')),
  contractDate: dateSchema,
  contractTypeId: z.number().nullable().optional(),
  contractEndDate: dateSchema,
  enrollmentDate: dateSchema,
  enrollmentOrderNum: z.string().optional().or(z.literal('')),
  enrollmentOrderDate: dateSchema,
  enrollmentOrderInfo: z.string().optional().or(z.literal('')),
  arrivedFrom: z.string().optional().or(z.literal('')),
  arrivalPositionIdx: z.string().optional().or(z.literal('')),
  currentPositionIdx: z.string().optional().or(z.literal('')),
  currentStatusCode: z.string().optional().or(z.literal('')),
  currentSubdivision: z.string().optional().or(z.literal('')),
  rankOrderDate: dateSchema,
  rankOrderInfo: z.string().optional().or(z.literal('')),

  // Documents
  idDocSeries: z.string().optional().or(z.literal('')),
  idDocNumber: z.string().optional().or(z.literal('')),
  idDocType: z.string().optional().or(z.literal('')),
  passportSeries: z.string().optional().or(z.literal('')),
  passportNumber: z.string().optional().or(z.literal('')),
  passportIssuedBy: z.string().optional().or(z.literal('')),
  passportIssuedDate: dateSchema,
  militaryIdSeries: z.string().optional().or(z.literal('')),
  militaryIdNumber: z.string().optional().or(z.literal('')),
  ubdSeries: z.string().optional().or(z.literal('')),
  ubdNumber: z.string().optional().or(z.literal('')),
  ubdDate: dateSchema,

  // Personal
  bloodTypeId: z.number().nullable().optional(),
  fitness: z.string().optional().or(z.literal('')),
  educationLevelId: z.number().nullable().optional(),
  educationInstitution: z.string().optional().or(z.literal('')),
  educationYear: z.string().optional().or(z.literal('')),
  militaryEducation: z.string().optional().or(z.literal('')),
  birthplace: z.string().optional().or(z.literal('')),
  addressActual: z.string().optional().or(z.literal('')),
  addressRegistered: z.string().optional().or(z.literal('')),
  maritalStatus: z.string().optional().or(z.literal('')),
  relativesInfo: z.string().optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  citizenship: z.string().optional().or(z.literal('')),

  // Other
  conscriptionDate: dateSchema,
  tccId: z.number().nullable().optional(),
  oblast: z.string().optional().or(z.literal('')),
  personalNumber: z.string().optional().or(z.literal('')),
  specialtyCode: z.string().optional().or(z.literal('')),
  additionalInfo: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export type PersonnelCreateInput = z.infer<typeof personnelCreateSchema>

// Partial schema for updates (all fields optional except none)
export const personnelUpdateSchema = personnelCreateSchema.partial().extend({
  status: z.enum(['active', 'excluded', 'disposed']).optional()
})

// Position create/update schema
export const positionCreateSchema = z.object({
  positionIndex: z.string().min(1, 'Індекс обов\'язковий'),
  subdivisionId: z.number({ required_error: 'Підрозділ обов\'язковий' }),
  title: z.string().min(1, 'Назва обов\'язкова'),
  detail: z.string().optional().or(z.literal('')),
  fullTitle: z.string().optional().or(z.literal('')),
  rankRequired: z.string().optional().or(z.literal('')),
  specialtyCode: z.string().optional().or(z.literal('')),
  tariffGrade: z.number().nullable().optional(),
  staffNumber: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  notes: z.string().optional().or(z.literal(''))
})

export type PositionCreateInput = z.infer<typeof positionCreateSchema>

export const positionUpdateSchema = positionCreateSchema.partial()

// Movement create schema
export const movementCreateSchema = z.object({
  personnelId: z.number({ required_error: 'Оберіть особу' }),
  orderType: z.string().min(1, 'Тип переміщення обов\'язковий'),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата початку обов\'язкова'),
  orderIssuer: z.string().optional().or(z.literal('')),
  orderNumber: z.string().optional().or(z.literal('')),
  orderDate: dateSchema,
  positionIndex: z.string().optional().or(z.literal('')),
  dailyOrderNumber: z.string().optional().or(z.literal('')),
  dateTo: dateSchema,
  previousPosition: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export type MovementCreateInput = z.infer<typeof movementCreateSchema>

// Status history create schema
export const statusHistoryCreateSchema = z.object({
  personnelId: z.number({ required_error: 'Оберіть особу' }),
  statusCode: z.string().min(1, 'Код статусу обов\'язковий'),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата початку обов\'язкова'),
  dateTo: dateSchema,
  presenceGroup: z.string().optional().or(z.literal('')),
  comment: z.string().optional().or(z.literal(''))
})

export type StatusHistoryCreateInput = z.infer<typeof statusHistoryCreateSchema>
