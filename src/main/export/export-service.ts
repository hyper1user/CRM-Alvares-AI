/**
 * Export service — orchestrates data fetching, building, and file writing
 */
import { dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { getDatabase } from '../db/connection'
import { auditLog } from '../db/schema'
import { fetchExportData } from './export-data'
import { buildEjoosWorkbook } from './ejoos-builder'
import { buildCsvContent } from './csv-builder'
import type { ExportResult, CsvExportResult } from '@shared/types/export'

export async function exportEjoos(): Promise<ExportResult> {
  const errors: string[] = []

  // Show save dialog
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Експорт ЕЖООС',
    defaultPath: `EJOOS_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  })

  if (canceled || !filePath) {
    return { success: false, filePath: '', stats: { positionsCount: 0, personnelCount: 0, excludedCount: 0, movementsCount: 0, statusesCount: 0 }, errors: ['Скасовано користувачем'] }
  }

  try {
    // Fetch data
    const data = fetchExportData()

    // Build workbook
    const wb = buildEjoosWorkbook(data)

    // Write file
    await wb.xlsx.writeFile(filePath)

    // Audit log
    const db = getDatabase()
    db.insert(auditLog)
      .values({
        tableName: 'export',
        recordId: 0,
        action: 'export_ejoos',
        newValues: JSON.stringify({ filePath, positions: data.positions.length, active: data.active.length, excluded: data.excluded.length, movements: data.movements.length, statuses: data.statuses.length })
      })
      .run()

    return {
      success: true,
      filePath,
      stats: {
        positionsCount: data.positions.length,
        personnelCount: data.active.length,
        excludedCount: data.excluded.length,
        movementsCount: data.movements.length,
        statusesCount: data.statuses.length
      },
      errors
    }
  } catch (err) {
    console.error('[export] EJOOS error:', err)
    return {
      success: false,
      filePath,
      stats: { positionsCount: 0, personnelCount: 0, excludedCount: 0, movementsCount: 0, statusesCount: 0 },
      errors: [String(err)]
    }
  }
}

export async function exportCsv(): Promise<CsvExportResult> {
  // Show save dialog
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Експорт CSV',
    defaultPath: `personnel_export_${new Date().toISOString().slice(0, 10)}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })

  if (canceled || !filePath) {
    return { success: false, filePath: '', recordsCount: 0, errors: ['Скасовано користувачем'] }
  }

  try {
    // Fetch data
    const data = fetchExportData()

    // Build CSV
    const { content, recordsCount } = buildCsvContent(data)

    // Write file (UTF-8 with BOM)
    await writeFile(filePath, content, 'utf-8')

    // Audit log
    const db = getDatabase()
    db.insert(auditLog)
      .values({
        tableName: 'export',
        recordId: 0,
        action: 'export_csv',
        newValues: JSON.stringify({ filePath, recordsCount })
      })
      .run()

    return {
      success: true,
      filePath,
      recordsCount,
      errors: []
    }
  } catch (err) {
    console.error('[export] CSV error:', err)
    return {
      success: false,
      filePath,
      recordsCount: 0,
      errors: [String(err)]
    }
  }
}
