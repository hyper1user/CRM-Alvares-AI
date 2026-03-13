/**
 * Format utilities for export (reverse of parse-utils)
 */

/**
 * Convert ISO date string to DD.MM.YYYY display format
 * "2024-03-14" → "14.03.2024"
 */
export function isoToDisplay(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return isoDate // return as-is if not ISO format
  return `${match[3]}.${match[2]}.${match[1]}`
}
