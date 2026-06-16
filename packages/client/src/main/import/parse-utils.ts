/**
 * Utility functions for parsing Excel data from EJOOS and Data.xlsx
 */

/** Excel serial date → ISO "YYYY-MM-DD" */
export function excelSerialToISO(serial: number): string {
  // Excel epoch: Jan 1, 1900 (with Lotus 1-2-3 bug: day 60 = Feb 29 1900)
  const epoch = new Date(1899, 11, 30)
  const ms = epoch.getTime() + serial * 86400000
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Parse a date value from Excel cell.
 * Handles: number (serial), DD.MM.YYYY string, ISO string, "т.ч." → null
 */
export function parseDateValue(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null

  // "т.ч." (теперішній час) means "current" / ongoing → null
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed === '' || trimmed === '0') return null
    if (trimmed.toLowerCase() === 'т.ч.' || trimmed.toLowerCase() === 'т.ч') return null

    // DD.MM.YYYY
    const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (dotMatch) {
      const [, dd, mm, yyyy] = dotMatch
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }

    // Already ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    // Try as number string
    const num = Number(trimmed)
    if (!isNaN(num) && num > 1000 && num < 100000) {
      return excelSerialToISO(num)
    }

    return null
  }

  if (typeof val === 'number') {
    if (val === 0) return null
    if (val > 1000 && val < 100000) {
      return excelSerialToISO(val)
    }
    return null
  }

  return null
}

/**
 * Split full name "ПРІЗВИЩЕ Ім'я По батькові" into parts.
 * Last name is typically UPPERCASE in EJOOS.
 */
export function splitFullName(name: string): {
  lastName: string
  firstName: string
  patronymic: string | null
} {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) {
    return { lastName: name.trim(), firstName: '', patronymic: null }
  }
  if (parts.length === 1) {
    return { lastName: parts[0], firstName: '', patronymic: null }
  }
  if (parts.length === 2) {
    return { lastName: parts[0], firstName: parts[1], patronymic: null }
  }
  // 3+ parts: first is lastName, second is firstName, rest is patronymic
  return {
    lastName: parts[0],
    firstName: parts[1],
    patronymic: parts.slice(2).join(' ')
  }
}

/** Trim string, return null if empty/falsy/zero */
export function cleanString(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  if (s === '' || s === '0' || s === 'null' || s === 'undefined') return null
  return s
}

/** Safe number parse, return null on failure */
export function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  if (isNaN(n)) return null
  return n
}

/** Get cell value from sheet row (array of values) */
export function cellVal(row: unknown[], col: number): unknown {
  if (!row || col < 0 || col >= row.length) return null
  return row[col]
}

/** Get string cell value */
export function cellStr(row: unknown[], col: number): string | null {
  return cleanString(cellVal(row, col))
}

/** Get date cell value */
export function cellDate(row: unknown[], col: number): string | null {
  return parseDateValue(cellVal(row, col))
}

/** Get number cell value */
export function cellNum(row: unknown[], col: number): number | null {
  return toNumber(cellVal(row, col))
}
