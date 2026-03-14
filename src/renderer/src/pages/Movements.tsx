import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Tag, DatePicker, Select, Input, Space, Typography } from 'antd'
import { PlusOutlined, SwapOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import dayjs from 'dayjs'
import { useMovementList } from '../hooks/useMovements'
import { useAppStore } from '../stores/app.store'
import MovementForm from '../components/movements/MovementForm'
import type { MovementListItem } from '@shared/types/movement'
import { MOVEMENT_ORDER_TYPES } from '@shared/enums/categories'

const { RangePicker } = DatePicker
const { Title } = Typography

const ORDER_TYPE_COLORS: Record<string, string> = {
  'Переміщення': 'blue',
  'В розпорядження': 'orange',
  'Прикомандирування': 'purple',
  'Переведення': 'cyan',
  'Зарахування': 'green',
  'Виключення': 'red',
  'Відновлення': 'lime'
}

export default function Movements(): JSX.Element {
  const globalSubdivision = useAppStore((s) => s.globalSubdivision)

  const [search, setSearch] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined
  ])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filters = useMemo(
    () => ({
      search: search || undefined,
      orderType: orderTypeFilter,
      subdivision: globalSubdivision,
      dateFrom: dateRange[0],
      dateTo: dateRange[1]
    }),
    [search, orderTypeFilter, globalSubdivision, dateRange]
  )

  const { data, loading, refetch } = useMovementList(filters)

  const columns: ProColumns<MovementListItem>[] = [
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
      title: 'Тип',
      dataIndex: 'orderType',
      width: 140,
      render: (_, record) => (
        <Tag color={ORDER_TYPE_COLORS[record.orderType] ?? 'default'}>
          {record.orderType}
        </Tag>
      )
    },
    {
      title: 'Наказ',
      dataIndex: 'orderNumber',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        const parts = [
          record.orderIssuer,
          record.orderNumber ? `№${record.orderNumber}` : null,
          record.orderDate ? `від ${dayjs(record.orderDate).format('DD.MM.YYYY')}` : null
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(' ') : '—'
      }
    },
    {
      title: 'Посада (на)',
      dataIndex: 'positionTitle',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.positionTitle || record.positionIndex || '—'
    },
    {
      title: 'Посада (з)',
      dataIndex: 'previousPositionTitle',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.previousPositionTitle || record.previousPosition || '—'
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
      title: 'Активне',
      dataIndex: 'isActive',
      width: 90,
      render: (_, record) =>
        record.isActive ? (
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
              <SwapOutlined /> Переміщення
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              Додати переміщення
            </Button>
          </Space>

          <Space wrap>
            <Input.Search
              placeholder="Пошук за ПІБ, ІПН, наказом..."
              allowClear
              style={{ width: 280 }}
              onSearch={setSearch}
              onChange={(e) => {
                if (!e.target.value) setSearch('')
              }}
            />
            <Select
              placeholder="Тип переміщення"
              allowClear
              style={{ width: 180 }}
              value={orderTypeFilter}
              onChange={setOrderTypeFilter}
              options={MOVEMENT_ORDER_TYPES.map((t) => ({ value: t, label: t }))}
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

          <ProTable<MovementListItem>
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

      <MovementForm
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={refetch}
      />
    </>
  )
}
