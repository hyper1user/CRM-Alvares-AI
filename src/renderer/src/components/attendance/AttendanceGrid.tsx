import { useState, useMemo } from 'react'
import { Table, Popover, Select, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useLookups } from '../../hooks/useLookups'
import type { PersonnelAttendanceRow } from '@shared/types/attendance'

interface AttendanceGridProps {
  year: number
  month: number
  rows: PersonnelAttendanceRow[]
  onRefetch: () => void
}

export default function AttendanceGrid({
  year,
  month,
  rows,
  onRefetch
}: AttendanceGridProps): JSX.Element {
  const { statusTypes } = useLookups()
  const [saving, setSaving] = useState(false)

  // Status maps
  const statusMap = useMemo(() => {
    const m = new Map<string, { name: string; colorCode: string | null; groupName: string }>()
    for (const s of statusTypes) {
      m.set(s.code, { name: s.name, colorCode: s.colorCode, groupName: s.groupName })
    }
    return m
  }, [statusTypes])

  // Status options grouped by groupName
  const statusOptions = useMemo(() => {
    const groups = new Map<string, typeof statusTypes>()
    for (const s of statusTypes) {
      if (!groups.has(s.groupName)) groups.set(s.groupName, [])
      groups.get(s.groupName)!.push(s)
    }
    return Array.from(groups.entries()).map(([group, items]) => ({
      label: group,
      options: items.map((s) => ({
        label: s.name,
        value: s.code
      }))
    }))
  }, [statusTypes])

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate()

  // Handle cell click — set day status
  const handleSetDay = async (personnelId: number, date: string, statusCode: string) => {
    setSaving(true)
    try {
      await window.api.attendanceSetDay(personnelId, date, statusCode)
      onRefetch()
    } catch (err) {
      message.error(`Помилка: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  // Build columns
  const columns: ColumnsType<PersonnelAttendanceRow> = [
    {
      title: '№',
      width: 45,
      fixed: 'left',
      render: (_v, _r, idx) => idx + 1
    },
    {
      title: 'ПІБ',
      dataIndex: 'fullName',
      width: 200,
      fixed: 'left',
      ellipsis: true,
      render: (text: string, record) => (
        <span>
          {record.rankName && (
            <span style={{ color: '#888', fontSize: 12 }}>{record.rankName} </span>
          )}
          {text}
        </span>
      )
    },
    // Day columns
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isWeekend = [0, 6].includes(new Date(year, month - 1, day).getDay())

      return {
        title: String(day),
        width: 38,
        align: 'center' as const,
        onHeaderCell: () => ({
          style: isWeekend ? { background: '#fff7e6' } : {}
        }),
        render: (_: unknown, record: PersonnelAttendanceRow) => {
          const code = record.days[dateStr] ?? null
          const st = code ? statusMap.get(code) : null

          const cellStyle: React.CSSProperties = {
            width: '100%',
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: 2,
            fontSize: 11,
            ...(st?.colorCode
              ? { background: st.colorCode + '33', color: st.colorCode }
              : isWeekend
                ? { background: '#fffbe6' }
                : {})
          }

          const content = (
            <div style={cellStyle}>
              {code ? (
                <span title={st?.name}>{code.slice(0, 3)}</span>
              ) : (
                <span style={{ color: '#ddd' }}>·</span>
              )}
            </div>
          )

          return (
            <Popover
              trigger="click"
              title={`${record.fullName} — ${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`}
              content={
                <Select
                  style={{ width: 260 }}
                  placeholder="Оберіть статус"
                  value={code}
                  options={statusOptions}
                  showSearch
                  optionFilterProp="label"
                  disabled={saving}
                  onChange={(val) => handleSetDay(record.personnelId, dateStr, val)}
                />
              }
            >
              {content}
            </Popover>
          )
        }
      }
    })
  ]

  // Summary row: count present/absent per day
  const summaryData = useMemo(() => {
    const present: number[] = new Array(daysInMonth).fill(0)
    const absent: number[] = new Array(daysInMonth).fill(0)
    const total = rows.length

    for (let i = 0; i < daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      for (const row of rows) {
        const code = row.days[dateStr]
        if (!code) continue
        const st = statusMap.get(code)
        if (st?.groupName === 'Так') {
          present[i]++
        } else {
          absent[i]++
        }
      }
    }

    return { present, absent, total }
  }, [rows, daysInMonth, year, month, statusMap])

  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey="personnelId"
      size="small"
      pagination={false}
      scroll={{ x: 200 + 45 + daysInMonth * 38 + 20, y: 'calc(100vh - 340px)' }}
      bordered
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2}>
              <strong>Наявні / Відсутні</strong>
            </Table.Summary.Cell>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <Table.Summary.Cell key={i} index={i + 2} align="center">
                <div style={{ fontSize: 10, lineHeight: '14px' }}>
                  <div style={{ color: 'green' }}>{summaryData.present[i] || ''}</div>
                  <div style={{ color: 'red' }}>{summaryData.absent[i] || ''}</div>
                </div>
              </Table.Summary.Cell>
            ))}
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
