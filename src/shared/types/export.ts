// ==================== EXPORT TYPES ====================

export interface ExportStats {
  positionsCount: number
  personnelCount: number
  excludedCount: number
  movementsCount: number
  statusesCount: number
}

export interface ExportResult {
  success: boolean
  filePath: string
  stats: ExportStats
  errors: string[]
}

export interface CsvExportResult {
  success: boolean
  filePath: string
  recordsCount: number
  errors: string[]
}
