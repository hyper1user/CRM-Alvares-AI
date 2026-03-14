import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Space, Popconfirm, message, Segmented } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import type { PersonnelListItem } from '@shared/types/personnel'
import RankBadge from '../components/personnel/RankBadge'
import StatusBadge from '../components/personnel/StatusBadge'
import PersonnelForm from '../components/personnel/PersonnelForm'
import { useLookups } from '../hooks/useLookups'
import { usePersonnelList } from '../hooks/usePersonnel'
import { useAppStore } from '../stores/app.store'

const CATEGORY_TABS = [
  { label: 'Всі', value: '' },
  { label: 'Офіцери', value: 'Офіцери' },
  { label: 'Сержанти', value: 'Сержанти' },
  { label: 'Солдати', value: 'Солдати' }
]

export default function PersonnelRegistry() {
  const navigate = useNavigate()
  const { statusTypes } = useLookups()
  const globalSubdivision = useAppStore((s) => s.globalSubdivision)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<PersonnelListItem | null>(null)

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      subdivision: globalSubdivision,
      statusCode: statusFilter,
      status: 'active'
    }),
    [search, category, globalSubdivision, statusFilter]
  )

  const { data, loading, refetch } = usePersonnelList(filters)

  const handleEdit = async (record: PersonnelListItem) => {
    // Fetch full record for edit
    const full = await window.api.personnelGet(record.id)
    setEditRecord(full)
    setDrawerOpen(true)
  }

  const handleDelete = async (id: number) => {
    await window.api.personnelDelete(id)
    message.success('Особу виключено')
    refetch()
  }

  const statusColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const st of statusTypes) {
      if (st.colorCode) map[st.code] = st.colorCode
    }
    return map
  }, [statusTypes])

  const columns: ProColumns<PersonnelListItem>[] = [
    {
      title: '№',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48
    },
    {
      title: 'ПІБ',
      dataIndex: 'fullName',
      ellipsis: true,
      width: 220,
      render: (_, record) => (
        <a onClick={() => navigate(`/personnel/${record.id}`)}>{record.fullName}</a>
      )
    },
    {
      title: 'Звання',
      dataIndex: 'rankName',
      width: 150,
      render: (_, record) => (
        <RankBadge rankName={record.rankName} category={record.rankCategory} />
      ),
      filters: [
        { text: 'Офіцери', value: 'Офіцери' },
        { text: 'Сержанти', value: 'Сержанти' },
        { text: 'Солдати', value: 'Солдати' }
      ],
      onFilter: (value, record) => record.rankCategory === value
    },
    {
      title: 'Підрозділ',
      dataIndex: 'currentSubdivision',
      width: 120
    },
    {
      title: 'Посада',
      dataIndex: 'positionTitle',
      ellipsis: true,
      width: 180,
      render: (_, record) => record.positionTitle || record.currentPositionIdx || '—'
    },
    {
      title: 'Статус',
      dataIndex: 'currentStatusCode',
      width: 140,
      render: (_, record) => (
        <StatusBadge
          statusCode={record.currentStatusCode}
          statusName={record.statusName}
          colorCode={record.currentStatusCode ? statusColorMap[record.currentStatusCode] : undefined}
        />
      )
    },
    {
      title: 'Позивний',
      dataIndex: 'callsign',
      width: 100
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      width: 140
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/personnel/${record.id}`)}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Виключити особу?"
            description="Запис буде переміщено до виключених"
            onConfirm={() => handleDelete(record.id)}
            okText="Так"
            cancelText="Ні"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <ProTable<PersonnelListItem>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        search={false}
        dateFormatter="string"
        scroll={{ x: 1200 }}
        pagination={{
          defaultPageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Всього: ${total}`
        }}
        headerTitle={
          <Space>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Реєстр особового складу</span>
            <Segmented
              options={CATEGORY_TABS}
              value={category}
              onChange={(val) => setCategory(val as string)}
              size="small"
            />
          </Space>
        }
        toolbar={{
          search: (
            <Input.Search
              placeholder="Пошук за ПІБ, ІПН, позивним..."
              allowClear
              onSearch={(val) => setSearch(val)}
              style={{ width: 300 }}
            />
          ),
          actions: [
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditRecord(null)
                setDrawerOpen(true)
              }}
            >
              Додати
            </Button>
          ]
        }}
        onRow={(record) => ({
          onDoubleClick: () => navigate(`/personnel/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />

      <PersonnelForm
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditRecord(null)
        }}
        onSaved={refetch}
        editRecord={editRecord as any}
      />
    </>
  )
}
