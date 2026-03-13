import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Tag, DatePicker, Select, Input, Space, Typography } from 'antd'
import { PlusOutlined, SwitcherOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import dayjs from 'dayjs'
import { useStatusHistoryList } from '../hooks/useStatusHistory'
import { useLookups } from '../hooks/useLookups'
import StatusHistoryForm from '../components/statuses/StatusHistoryForm'
import type { StatusHistoryListItem } from '@shared/types/statusHistory'

const { RangePicker } = DatePicker
const { Title } = Typography

export default function StatusBoard(): JSX.Element {
  const { statusTypes } = useLookups()

  const [search, setSearch] = useState('')
  const [statusCodeFilter, setStatusCodeFilter] = useState<string | undefined>()
  const [groupFilter, setGroupFilter] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined
  ])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filters = useMemo(
    () => ({
      search: search || undefined,
      statusCode: statusCodeFilter,
      groupName: groupFilter,
      dateFrom: dateRange[0],
      dateTo: dateRange[1]
    }),
    [search, statusCodeFilter, groupFilter, dateRange]
  )

  const { data, loading, refetch } = useStatusHistoryList(filters)

  // Unique group names for filter
  const groupNames = useMemo(() => {
    const groups = new Set(statusTypes.map((s) => s.groupName))
    return Array.from(groups).sort()
  }, [statusTypes])

  const columns: ProColumns<StatusHistoryListItem>[] = [
    {
      title: '№',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48
    },
    {
      title: 'ПІБ',
      dataIndex: 'fullName',
      width: 220,
      ellipsis: true,
      render: (_, record) => (
        <Link to={`/personnel/${record.personnelId}`}>
          {record.rankName ? `${record.rankName} ` : ''}
          {record.fullName}
        </Link>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'statusName',
      width: 180,
      render: (_, record) => (
        <Tag color={record.statusColor || 'default'}>
          {record.statusCode} — {record.statusName}
        </Tag>
      )
    },
    {
      title: 'Група',
      dataIndex: 'groupName',
      width: 140,
      ellipsis: true
    },
    {
      title: 'Дата з',
      dataIndex: 'dateFrom',
      width: 110,
      render: (_, record) => (record.dateFrom ? dayjs(record.dateFrom).format('DD.MM.YYYY') : '—')
    },
    {
      title: 'Дата по',
      dataIndex: 'dateTo',
      width: 110,
      render: (_, record) => (record.dateTo ? dayjs(record.dateTo).format('DD.MM.YYYY') : '—')
    },
    {
      title: 'Присутність',
      dataIndex: 'presenceGroup',
      width: 100,
      render: (_, record) => record.presenceGroup || '—'
    },
    {
      title: 'Коментар',
      dataIndex: 'comment',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.comment || '—'
    },
    {
      title: 'Поточний',
      dataIndex: 'isLast',
      width: 90,
      render: (_, record) =>
        record.isLast ? (
          <Tag color="green">Так</Tag>
        ) : (
          <Tag color="default">Ні</Tag>
        )
    }
  ]

  return (
    <>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" wrap style={{ justifyContent: 'space-between', width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>
              <SwitcherOutlined /> Статуси
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              Додати статус
            </Button>
          </Space>

          <Space wrap>
            <Input.Search
              placeholder="Пошук за ПІБ, ІПН, статусом..."
              allowClear
              style={{ width: 280 }}
              onSearch={setSearch}
              onChange={(e) => {
                if (!e.target.value) setSearch('')
              }}
            />
            <Select
              placeholder="Код статусу"
              allowClear
              showSearch
              style={{ width: 200 }}
              value={statusCodeFilter}
              onChange={setStatusCodeFilter}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={statusTypes.map((s) => ({
                value: s.code,
                label: `${s.code} — ${s.name}`
              }))}
            />
            <Select
              placeholder="Група"
              allowClear
              style={{ width: 180 }}
              value={groupFilter}
              onChange={setGroupFilter}
              options={groupNames.map((g) => ({ value: g, label: g }))}
            />
            <RangePicker
              format="DD.MM.YYYY"
              onChange={(dates) => {
                setDateRange([
                  dates?.[0]?.format('YYYY-MM-DD'),
                  dates?.[1]?.format('YYYY-MM-DD')
                ])
              }}
            />
          </Space>

          <ProTable<StatusHistoryListItem>
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            search={false}
            options={false}
            pagination={{
              defaultPageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `Всього: ${total}`
            }}
            scroll={{ x: 1300 }}
          />
        </Space>
      </Card>

      <StatusHistoryForm
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={refetch}
      />
    </>
  )
}
