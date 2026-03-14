import { useState, useEffect, useMemo } from 'react'
import { Card, DatePicker, Button, Space, Spin, Typography, message, Empty } from 'antd'
import { LineChartOutlined, CameraOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useLookups } from '../hooks/useLookups'
import { useAppStore } from '../stores/app.store'
import FormationSummary from '../components/attendance/FormationSummary'
import type { FormationReportData, FormationGroup, FormationSubdivision } from '@shared/types/attendance'
import type { AttendanceMonthData } from '@shared/types/attendance'

const { Title } = Typography

export default function FormationReport(): JSX.Element {
  const [date, setDate] = useState(dayjs())
  const [loading, setLoading] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [monthData, setMonthData] = useState<AttendanceMonthData | null>(null)
  const globalSubdivision = useAppStore((s) => s.globalSubdivision)

  const { statusTypes, subdivisions } = useLookups()

  // Fetch data for the selected date's month
  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await window.api.attendanceGetMonth(date.year(), date.month() + 1, globalSubdivision)
      setMonthData(result)
    } catch (err) {
      message.error(`Помилка: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [date.format('YYYY-MM-DD'), globalSubdivision])

  // Build formation report from attendance data for the selected date
  const reportData: FormationReportData | null = useMemo(() => {
    if (!monthData || monthData.rows.length === 0) return null

    const dateStr = date.format('YYYY-MM-DD')
    const totalActive = monthData.rows.length

    // Status type maps
    const stMap = new Map(statusTypes.map((s) => [s.code, s]))
    const subMap = new Map(subdivisions.map((s) => [s.code, s.name]))

    // Count by statusCode
    const statusCounts = new Map<string, number>()
    // Count by subdivision: present / absent
    const subPresent = new Map<string, number>()
    const subTotal = new Map<string, number>()

    let hasAnyData = false

    for (const row of monthData.rows) {
      const code = row.days[dateStr]
      const subCode = row.subdivisionCode ?? 'UNKNOWN'

      subTotal.set(subCode, (subTotal.get(subCode) ?? 0) + 1)

      if (code) {
        hasAnyData = true
        statusCounts.set(code, (statusCounts.get(code) ?? 0) + 1)

        const st = stMap.get(code)
        if (st?.groupName === 'Так') {
          subPresent.set(subCode, (subPresent.get(subCode) ?? 0) + 1)
        }
      }
    }

    if (!hasAnyData) return null

    // Build groups
    const groups: FormationGroup[] = []
    for (const [code, count] of statusCounts) {
      const st = stMap.get(code)
      groups.push({
        groupName: st?.groupName ?? 'Інше',
        statusCode: code,
        statusName: st?.name ?? code,
        colorCode: st?.colorCode ?? null,
        count
      })
    }
    groups.sort((a, b) => a.groupName.localeCompare(b.groupName))

    // Build by subdivision
    const bySubdivision: FormationSubdivision[] = []
    for (const [code, total] of subTotal) {
      const present = subPresent.get(code) ?? 0
      bySubdivision.push({
        code,
        name: subMap.get(code) ?? code,
        total,
        present,
        absent: total - present
      })
    }
    bySubdivision.sort((a, b) => a.code.localeCompare(b.code))

    return {
      date: dateStr,
      totalActive,
      groups,
      bySubdivision
    }
  }, [monthData, date, statusTypes, subdivisions])

  const handleSnapshot = async () => {
    const dateStr = date.format('YYYY-MM-DD')
    setSnapshotLoading(true)
    try {
      const result = await window.api.attendanceSnapshot(dateStr)
      message.success(`Snapshot створено: ${result.created} записів`)
      fetchData()
    } catch (err) {
      message.error(`Помилка: ${err}`)
    } finally {
      setSnapshotLoading(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            <LineChartOutlined /> Стройова записка
          </Title>
          <Space>
            <DatePicker
              value={date}
              onChange={(v) => v && setDate(v)}
              allowClear={false}
              format="DD.MM.YYYY"
            />
            <Button
              icon={<CameraOutlined />}
              loading={snapshotLoading}
              onClick={handleSnapshot}
            >
              Snapshot за обрану дату
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : reportData ? (
          <FormationSummary data={reportData} />
        ) : (
          <Empty
            description={
              <span>
                Немає даних за {date.format('DD.MM.YYYY')}.
                <br />
                Натисніть &quot;Snapshot за обрану дату&quot; для створення записів
                з поточних статусів ОС.
              </span>
            }
          />
        )}
      </Card>
    </div>
  )
}
