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

export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]{7,20}$/).optional()

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
