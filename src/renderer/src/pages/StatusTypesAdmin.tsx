import { useState, useMemo, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  App,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Space,
  Tag,
  Popconfirm,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { STATUS_GROUP_NAMES, type StatusGroupName } from '@shared/validators'
import type { StatusTypeEntry } from '@shared/enums/status-codes'

type FormValues = {
  code: string
  name: string
  groupName: StatusGroupName
  onSupply: boolean
  rewardAmount: number | null
  sortOrder: number
  colorCode: string
}

const GROUP_OPTIONS: Array<{ label: string; value: StatusGroupName; hint: string }> = [
  { label: 'Так — присутні', value: 'Так', hint: 'РВ, РЗ, РШ, ППД, АДП, БЗВП' },
  { label: 'Лікування', value: 'Лікування', hint: 'ШП' },
  { label: 'Відпустка', value: 'Відпустка', hint: 'ВП, ДВП, ВПХ, ВПС, ВПП' },
  { label: 'Відрядження', value: 'Відрядження', hint: 'ВД' },
  { label: 'СЗЧ', value: 'СЗЧ', hint: '' },
  { label: 'Загиблі', value: 'Загиблі', hint: '200' },
  { label: 'Зниклі безвісти', value: 'Зниклі безвісти', hint: 'ЗБ' },
  { label: 'Полон', value: 'Полон', hint: 'ПОЛОН' },
  { label: 'Ні — позначки табелю', value: 'Ні', hint: 'НП, ВБВ, ЗВ, АР' }
]

const GROUP_COLORS: Record<StatusGroupName, string> = {
  Так: 'green',
  Лікування: 'orange',
  Відпустка: 'blue',
  Відрядження: 'cyan',
  СЗЧ: 'red',
  Загиблі: 'default',
  'Зниклі безвісти': 'default',
  Полон: 'default',
  Ні: 'default'
}

export default function StatusTypesAdmin(): JSX.Element {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const [data, setData] = useState<StatusTypeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<StatusGroupName | 'all'>('all')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<StatusTypeEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const rows = (await window.api.statusTypesList()) as StatusTypeEntry[]
      setData(rows ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    let rows = data
    if (groupFilter !== 'all') rows = rows.filter((r) => r.groupName === groupFilter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
      )
    }
    return rows
  }, [data, groupFilter, search])

  const grouped = useMemo(() => {
    const m = new Map<StatusGroupName, StatusTypeEntry[]>()
    for (const r of filtered) {
      const g = r.groupName as StatusGroupName
      if (!m.has(g)) m.set(g, [])
      m.get(g)!.push(r)
    }
    // Reorder за фіксованим списком груп — щоб порядок був передбачуваним.
    const ordered: Array<{ group: StatusGroupName; rows: StatusTypeEntry[] }> = []
    for (const g of STATUS_GROUP_NAMES) {
      if (m.has(g)) ordered.push({ group: g, rows: m.get(g)! })
    }
    return ordered
  }, [filtered])

  const handleAdd = () => {
    setEditRecord(null)
    form.resetFields()
    form.setFieldsValue({
      onSupply: false,
      sortOrder: 99,
      colorCode: '#999999',
      groupName: 'Так',
      rewardAmount: null
    })
    setDrawerOpen(true)
  }

  const handleEdit = (record: StatusTypeEntry) => {
    setEditRecord(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      groupName: record.groupName as StatusGroupName,
      onSupply: record.onSupply,
      rewardAmount: record.rewardAmount,
      sortOrder: record.sortOrder,
      colorCode: record.colorCode || '#999999'
    })
    setDrawerOpen(true)
  }

  const handleDelete = async (record: StatusTypeEntry) => {
    try {
      const usage = await window.api.statusTypeUsage(record.code)
      const total = usage.personnel + usage.statusHistory + usage.attendance
      if (total > 0) {
        modal.warning({
          title: `Не можна видалити «${record.code}»`,
          content: (
            <div>
              Цей статус використовується:
              <ul style={{ margin: '8px 0 0 16px', paddingLeft: 8 }}>
                <li>Поточний статус: {usage.personnel} ОС</li>
                <li>Історія статусів: {usage.statusHistory} запис(ів)</li>
                <li>Табель: {usage.attendance} відмітка(ок)</li>
              </ul>
              <div style={{ marginTop: 12, color: 'var(--fg-3)', fontSize: 12 }}>
                Спочатку переведіть особовий склад на інший статус.
              </div>
            </div>
          )
        })
        return
      }
      await window.api.statusTypeDelete(record.id)
      message.success(`Статус «${record.code}» видалено`)
      fetchData()
    } catch (err) {
      message.error(`Помилка: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      try {
        if (editRecord) {
          await window.api.statusTypeUpdate({ ...values, id: editRecord.id })
          message.success(`Статус «${values.code}» оновлено`)
        } else {
          await window.api.statusTypeCreate(values)
          message.success(`Статус «${values.code}» додано`)
        }
        setDrawerOpen(false)
        fetchData()
      } catch (err) {
        message.error(`Помилка: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setSaving(false)
      }
    } catch {
      // Form validation error — поля підсвітились
    }
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="titles">
          <div className="eyebrow">довідник · {data.length} статусів</div>
          <h1>Статуси особового складу</h1>
          <div className="sub">
            Коди, назви, кольори. Групи (присутність/відпустка/лікування/тощо) фіксовані —
            визначають семантику Дашборду, Канбану, ДГВ-табелю.
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => navigate('/settings')}>
            <ArrowLeftOutlined />
            Назад
          </button>
          <button className="btn primary" onClick={handleAdd}>
            <PlusOutlined />
            Додати статус
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          padding: 10,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow">група</span>
          <Select
            value={groupFilter}
            onChange={setGroupFilter}
            style={{ width: 200 }}
            options={[
              { label: 'Усі групи', value: 'all' },
              ...GROUP_OPTIONS.map((g) => ({ label: g.label, value: g.value }))
            ]}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div className="search-bar" style={{ width: 240 }}>
          <SearchOutlined style={{ fontSize: 13 }} />
          <input
            placeholder="РВ, Відпустка…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Код</th>
                <th>Назва</th>
                <th style={{ width: 180 }}>Група</th>
                <th style={{ width: 110 }}>На забезп.</th>
                <th style={{ width: 130 }}>Винагорода</th>
                <th style={{ width: 80 }}>Порядок</th>
                <th style={{ width: 80 }}>Колір</th>
                <th style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: 'center', padding: 40, color: 'var(--fg-3)' }}
                  >
                    Завантаження…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: 'center', padding: 40, color: 'var(--fg-3)' }}
                  >
                    Не знайдено
                  </td>
                </tr>
              )}
              {grouped.map(({ group, rows }) => (
                <Fragment key={group}>
                  <tr style={{ background: 'var(--bg-2)' }}>
                    <td colSpan={8} style={{ padding: '6px 12px' }}>
                      <Tag color={GROUP_COLORS[group]} style={{ fontSize: 11 }}>
                        {group}
                      </Tag>
                      <span className="mono dim" style={{ marginLeft: 8, fontSize: 11 }}>
                        {rows.length} код(и)
                      </span>
                    </td>
                  </tr>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span
                          className="mono"
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: 3,
                            background: r.colorCode || '#999',
                            color: '#000',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          {r.code}
                        </span>
                      </td>
                      <td>{r.name}</td>
                      <td>
                        <Tag color={GROUP_COLORS[r.groupName as StatusGroupName]}>
                          {r.groupName}
                        </Tag>
                      </td>
                      <td>{r.onSupply ? <Tag color="green">так</Tag> : <span className="dim">—</span>}</td>
                      <td className="mono tnum">
                        {r.rewardAmount ? r.rewardAmount.toLocaleString('uk-UA') : '—'}
                      </td>
                      <td className="mono tnum">{r.sortOrder}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            borderRadius: 3,
                            background: r.colorCode || '#999',
                            border: '1px solid var(--line-1)',
                            verticalAlign: 'middle'
                          }}
                          title={r.colorCode || ''}
                        />
                      </td>
                      <td>
                        <Space size={4}>
                          <Tooltip title="Редагувати">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(r)}
                            />
                          </Tooltip>
                          <Popconfirm
                            title={`Видалити «${r.code}»?`}
                            description="Дія незворотна. Перевіримо використання."
                            onConfirm={() => handleDelete(r)}
                            okText="Видалити"
                            cancelText="Скасувати"
                            okButtonProps={{ danger: true }}
                          >
                            <Tooltip title="Видалити">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                              />
                            </Tooltip>
                          </Popconfirm>
                        </Space>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        title={editRecord ? `Редагувати: ${editRecord.code}` : 'Новий статус'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Скасувати</Button>
            <Button type="primary" loading={saving} onClick={handleSubmit}>
              {editRecord ? 'Зберегти' : 'Додати'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="code"
            label="Код"
            rules={[
              { required: true, message: 'Обов’язковий' },
              { max: 10, message: 'Не більше 10 символів' },
              {
                pattern: /^[A-ZА-ЯҐЄІЇ0-9]{1,10}$/u,
                message: 'Лише ВЕЛИКІ літери та цифри'
              }
            ]}
            extra={
              editRecord ? (
                <span style={{ fontSize: 11, color: 'var(--warn)' }}>
                  <WarningOutlined /> Зміна коду заборонена, якщо статус використовується
                </span>
              ) : (
                'Короткий код, як у ЕЖООС: РВ, ВП, ШП…'
              )
            }
          >
            <Input
              autoFocus={!editRecord}
              maxLength={10}
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => form.setFieldValue('code', e.target.value.toUpperCase())}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Назва"
            rules={[{ required: true, message: 'Обов’язкова' }]}
          >
            <Input placeholder="Район виконання" />
          </Form.Item>

          <Form.Item
            name="groupName"
            label="Група"
            rules={[{ required: true, message: 'Оберіть групу' }]}
            extra="Визначає категоризацію в Дашборді/Канбані. Список фіксований розробником."
          >
            <Select
              options={GROUP_OPTIONS.map((g) => ({
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{g.label}</span>
                    {g.hint && (
                      <span className="mono dim" style={{ fontSize: 10 }}>
                        {g.hint}
                      </span>
                    )}
                  </div>
                ),
                value: g.value
              }))}
            />
          </Form.Item>

          <Form.Item
            name="onSupply"
            label="На бойовому забезпеченні"
            valuePropName="checked"
            extra="Тільки бойові коди групи «Так» (РВ/РЗ/РШ/ППД/АДП/БЗВП). Доступні для розпорядженців — ні."
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="rewardAmount"
            label="Винагорода (грн)"
            extra="Опційно. Сума для категорії «бойове виконання» (РВ — 100 000, РЗ — 30 000)."
          >
            <InputNumber min={0} step={1000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="Порядок"
            rules={[{ required: true, message: 'Обов’язково' }]}
            extra="Менше = вище. Канбан і списки використовують це значення."
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="colorCode"
            label="Колір"
            rules={[
              { required: true, message: 'Обов’язково' },
              { pattern: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, message: '#RRGGBB або #RGB' }
            ]}
            extra="Використовується в Канбані, табелі, donut'і."
          >
            <Input
              type="color"
              style={{ width: 80, padding: 2, height: 36 }}
              addonAfter={
                <span className="mono" style={{ fontSize: 12 }}>
                  {Form.useWatch('colorCode', form) || '—'}
                </span>
              }
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  )
}
