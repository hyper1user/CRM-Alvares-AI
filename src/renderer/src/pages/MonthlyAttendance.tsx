import { useState } from 'react'
import { Card, DatePicker, Select, Button, Space, Spin, message, Typography } from 'antd'
import { CalendarOutlined, CameraOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useMonthlyAttendance } from '../hooks/useAttendance'
import { useLookups } from '../hooks/useLookups'
import AttendanceGrid from '../components/attendance/AttendanceGrid'

const { Title } = Typography

export default function MonthlyAttendance(): JSX.Element {
  const today = dayjs()
  const [year, setYear] = useState(today.year())
  const [month, setMonth] = useState(today.month() + 1)
  const [subdivision, setSubdivision] = useState<string | undefined>(undefined)
  const [snapshotLoading, setSnapshotLoading] = useState(false)

  const { subdivisions } = useLookups()
  const { data, loading, refetch } = useMonthlyAttendance(year, month, subdivision)

  const handleMonthChange = (value: dayjs.Dayjs | null) => {
    if (value) {
      setYear(value.year())
      setMonth(value.month() + 1)
    }
  }

  const handleSnapshot = async () => {
    const date = dayjs().format('YYYY-MM-DD')
    setSnapshotLoading(true)
    try {
      const result = await window.api.attendanceSnapshot(date)
      message.success(`Snapshot створено: ${result.created} записів`)
      refetch()
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
            <CalendarOutlined /> Місячний табель
          </Title>
          <Space>
            <DatePicker
              picker="month"
              value={dayjs(`${year}-${String(month).padStart(2, '0')}-01`)}
              onChange={handleMonthChange}
              allowClear={false}
              format="MMMM YYYY"
            />
            <Select
              style={{ width: 200 }}
              placeholder="Всі підрозділи"
              allowClear
              value={subdivision}
              onChange={setSubdivision}
              options={subdivisions.map((s) => ({
                label: `${s.code} — ${s.name}`,
                value: s.code
              }))}
            />
            <Button
              type="primary"
              icon={<CameraOutlined />}
              loading={snapshotLoading}
              onClick={handleSnapshot}
            >
              Snapshot поточного дня
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : data && data.rows.length > 0 ? (
          <AttendanceGrid
            year={year}
            month={month}
            rows={data.rows}
            onRefetch={refetch}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
            Немає даних. Натисніть &quot;Snapshot поточного дня&quot; для заповнення табелю
            з поточних статусів ОС.
          </div>
        )}
      </Card>
    </div>
  )
}
