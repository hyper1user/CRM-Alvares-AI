import { useNavigate } from 'react-router-dom'
import { Button, Space, Popconfirm, message, Input, DatePicker } from 'antd'
import { EyeOutlined, UndoOutlined } from '@ant-design/icons'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import type { PersonnelListItem } from '@shared/types/personnel'
import RankBadge from '../components/personnel/RankBadge'
import { usePersonnelList } from '../hooks/usePersonnel'
import { useState, useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'

export default function ExcludedPersonnel() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState<Dayjs | null>(null)

  // v0.9.4: фільтр subdivision='Г-3' прибрано. До v0.9.4 виключені, у яких
  // currentSubdivision != 'Г-3' (наприклад, виключення відбулось коли особа
  // була у розпорядженні — `currentSubdivision='розпорядження'`), не
  // показувались. Міграція `restoreSubdivisionForExcluded()` (v0.8.7) рятувала
  // лише NULL-кейс. Додаток для одного підрозділу — фільтр `status='excluded'`
  // достатній.
  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: 'excluded'
    }),
    [search]
  )

  const { data, loading, refetch } = usePersonnelList(filters)

  // Клієнтська фільтрація по місяцю виключення. Бекенд повертає всіх excluded,
  // а тут звужуємо до конкретного місяця. Запис без excludedAt (старі/орфани)
  // ховаємо лише коли фільтр активний — без фільтра показуємо все як було.
  const filteredData = useMemo(() => {
    if (!monthFilter) return data
    return data.filter((p) => {
      if (!p.excludedAt) return false
      return dayjs(p.excludedAt).isSame(monthFilter, 'month')
    })
  }, [data, monthFilter])

  const handleRestore = async (id: number) => {
    await window.api.personnelUpdate(id, { status: 'active' })
    message.success('Особу відновлено')
    refetch()
  }

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
      )
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
      title: 'Дата виключення',
      dataIndex: 'excludedAt',
      width: 140,
      render: (_, record) =>
        record.excludedAt ? dayjs(record.excludedAt).format('DD.MM.YYYY') : '—'
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
      title: 'ІПН',
      dataIndex: 'ipn',
      width: 120
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/personnel/${record.id}`)}
          />
          <Popconfirm
            title="Відновити особу?"
            description="Запис буде повернено до активного складу"
            onConfirm={() => handleRestore(record.id)}
            okText="Так"
            cancelText="Ні"
          >
            <Button type="link" size="small" icon={<UndoOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const subTitle = monthFilter
    ? `${filteredData.length} з ${data.length} (${monthFilter.format('MMMM YYYY')})`
    : `${data.length} записів`

  return (
    <>
      <div className="page-header">
        <div className="titles">
          <div className="eyebrow">особовий склад · виключені</div>
          <h1>Виключені з особового складу</h1>
          <div className="sub">{subTitle}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <ProTable<PersonnelListItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          search={false}
          dateFormatter="string"
          scroll={{ x: 1240 }}
          pagination={{
            defaultPageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Всього: ${total}`
          }}
          toolbar={{
            search: (
              <Space>
                <DatePicker
                  picker="month"
                  placeholder="Місяць виключення"
                  value={monthFilter}
                  onChange={(val) => setMonthFilter(val)}
                  format="MMMM YYYY"
                  allowClear
                  style={{ width: 200 }}
                />
                <Input.Search
                  placeholder="Пошук за ПІБ, ІПН..."
                  allowClear
                  onSearch={(val) => setSearch(val)}
                  style={{ width: 280 }}
                />
              </Space>
            )
          }}
        />
      </div>
    </>
  )
}
