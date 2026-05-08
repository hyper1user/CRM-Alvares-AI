import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Select, Table, Tag, Tooltip, Button, Badge, Popconfirm } from 'antd'
import {
  ArrowLeftOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  ClearOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { BR_ROLES, BR_ROLE_NAMES, autoAssignRole } from '@shared/enums/br-roles'
import type { PersonnelListItem } from '@shared/types/personnel'

const NONE_KEY = '__none__' // Select-значення для null (Antd не любить null у Select)

export default function BrRolesAdmin(): JSX.Element {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [data, setData] = useState<PersonnelListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  // Локальний draft assignments (personId → brRole | null). Initialized from БД при fetch'і;
  // на «Зберегти» порівнюємо з оригіналом і відправляємо тільки diff.
  const [draft, setDraft] = useState<Map<number, string | null>>(new Map())
  const [original, setOriginal] = useState<Map<number, string | null>>(new Map())
  const [saving, setSaving] = useState(false)

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    try {
      const list = (await window.api.personnelList({ status: 'active' })) as PersonnelListItem[]
      // Тільки штатні (Г-3), бо адмінка ролей — для тих, хто буде у Розпорядженні.
      const active = (list ?? []).filter(
        (p) => p.currentSubdivision === 'Г-3' && p.status === 'active'
      )
      setData(active)
      const map = new Map<number, string | null>(active.map((p) => [p.id, p.brRole ?? null]))
      setDraft(new Map(map))
      setOriginal(map)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    let rows = data
    if (filterRole === 'none') {
      rows = rows.filter((p) => !draft.get(p.id))
    } else if (filterRole !== 'all') {
      rows = rows.filter((p) => draft.get(p.id) === filterRole)
    }
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          (p.positionTitle ?? '').toLowerCase().includes(q) ||
          (p.callsign ?? '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [data, filterRole, search, draft])

  // Лічильник по кожній ролі для бейджів у Select-фільтрі.
  const roleCounts = useMemo(() => {
    const counts = new Map<string | null, number>()
    counts.set(null, 0)
    for (const r of BR_ROLE_NAMES) counts.set(r, 0)
    for (const p of data) {
      const r = draft.get(p.id) ?? null
      counts.set(r, (counts.get(r) ?? 0) + 1)
    }
    return counts
  }, [data, draft])

  const dirtyCount = useMemo(() => {
    let n = 0
    for (const [id, val] of draft) {
      if (original.get(id) !== val) n++
    }
    return n
  }, [draft, original])

  const handleRoleChange = (personId: number, roleKey: string): void => {
    const newRole = roleKey === NONE_KEY ? null : roleKey
    setDraft((prev) => {
      const next = new Map(prev)
      next.set(personId, newRole)
      return next
    })
  }

  const handleAutoFill = (): void => {
    let filled = 0
    setDraft((prev) => {
      const next = new Map(prev)
      for (const p of data) {
        if (next.get(p.id)) continue // не перезаписуємо існуючі
        const auto = autoAssignRole(p.positionTitle ?? '')
        if (auto) {
          next.set(p.id, auto)
          filled++
        }
      }
      return next
    })
    message.info(filled > 0 ? `Авто-заповнено ${filled} ролей` : 'Усі підходящі ОС вже мають роль')
  }

  const handleClearAll = (): void => {
    setDraft((prev) => {
      const next = new Map(prev)
      for (const id of next.keys()) next.set(id, null)
      return next
    })
    message.info('Усі ролі очищено (не збережено)')
  }

  const handleSave = async (): Promise<void> => {
    if (dirtyCount === 0) {
      message.info('Немає змін для збереження')
      return
    }
    setSaving(true)
    try {
      const diff: Array<{ personnelId: number; brRole: string | null }> = []
      for (const [id, val] of draft) {
        if (original.get(id) !== val) {
          diff.push({ personnelId: id, brRole: val })
        }
      }
      const result = await window.api.personnelBrRolesBulkSet(diff)
      if (result?.error) {
        message.error(result.message ?? 'Помилка збереження')
        return
      }
      message.success(`Збережено зміни для ${result?.updated ?? diff.length} ОС`)
      // Synchronize "original" with new state.
      setOriginal(new Map(draft))
    } catch (err) {
      message.error(`Помилка: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<PersonnelListItem> = [
    {
      title: '№',
      dataIndex: 'currentPositionIdx',
      width: 80,
      render: (idx: string | null) => (
        <span className="mono dim" style={{ fontSize: 11 }}>
          {idx ?? '—'}
        </span>
      )
    },
    {
      title: 'Звання',
      dataIndex: 'rankName',
      width: 140,
      render: (r: string | null) => r ?? <span className="dim">—</span>
    },
    {
      title: 'ПІБ',
      dataIndex: 'fullName',
      width: 280,
      render: (name: string, row) => (
        <span>
          {name}
          {row.callsign && (
            <Tag color="cyan" style={{ marginLeft: 8, fontSize: 10 }}>
              {row.callsign}
            </Tag>
          )}
        </span>
      )
    },
    {
      title: 'Посада',
      dataIndex: 'positionTitle',
      render: (title: string | null) => (
        <span style={{ fontSize: 12 }}>{title ?? <span className="dim">—</span>}</span>
      )
    },
    {
      title: 'Роль у БР',
      width: 320,
      render: (_, row) => {
        const current = draft.get(row.id) ?? null
        const isDirty = original.get(row.id) !== current
        return (
          <Select
            value={current ?? NONE_KEY}
            onChange={(v) => handleRoleChange(row.id, v)}
            style={{
              width: '100%',
              ...(isDirty ? { outline: '2px solid var(--accent)', borderRadius: 4 } : {})
            }}
            size="small"
            options={[
              { label: '— без ролі —', value: NONE_KEY },
              ...BR_ROLES.map((r) => ({ label: r.name, value: r.name }))
            ]}
          />
        )
      }
    }
  ]

  return (
    <>
      <div className="page-header">
        <div className="titles">
          <div className="eyebrow">
            довідник · {data.length} ОС у штаті
            {dirtyCount > 0 && (
              <Badge count={dirtyCount} style={{ marginLeft: 8, backgroundColor: 'var(--warn)' }} />
            )}
          </div>
          <h1>Ролі у Бойовому розпорядженні</h1>
          <div className="sub">
            Призначення штатних позицій для генерації БР: 15 ролей з шаблону Variant_A
            (Заступник/МПЗ/Технік/Сержант/Медик/Евак/БМП/Взводи/Водії/Зв'язок/Резерв/FPV/Логістика).
            Роль персистентна — застосовується для всіх БР, поки не зміниш. У Розпорядженні роль{' '}
            <b>ігнорується</b>, якщо боєць у статусі <code>РОП</code> (на ЛБЗ) — він іде у блок
            «Особовому складу на позиціях».
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => navigate('/settings')}>
            <ArrowLeftOutlined /> Назад
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="card"
        style={{
          padding: 10,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap'
        }}
      >
        <Tooltip title="Для пустих ролей — мапить за ключовими словами в посаді (заступник→ZKR, медик→MEDIC тощо). Існуючі призначення не зачіпає.">
          <Button icon={<ThunderboltOutlined />} onClick={handleAutoFill}>
            Авто-заповнити за посадою
          </Button>
        </Tooltip>

        <Popconfirm
          title="Очистити всі ролі?"
          description="Це не зберігається — натисни «Зберегти» щоб закріпити в БД."
          onConfirm={handleClearAll}
          okText="Очистити"
          cancelText="Скасувати"
        >
          <Button icon={<ClearOutlined />} danger>
            Очистити всі
          </Button>
        </Popconfirm>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="eyebrow">фільтр</span>
          <Select
            value={filterRole}
            onChange={setFilterRole}
            style={{ width: 240 }}
            options={[
              { label: `Усі (${data.length})`, value: 'all' },
              { label: `— без ролі — (${roleCounts.get(null) ?? 0})`, value: 'none' },
              ...BR_ROLES.map((r) => ({
                label: `${r.name} (${roleCounts.get(r.name) ?? 0})`,
                value: r.name
              }))
            ]}
          />
        </div>

        <div className="search-bar" style={{ width: 240 }}>
          <SearchOutlined style={{ fontSize: 13 }} />
          <input
            placeholder="ПІБ, посада, позивний…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          disabled={dirtyCount === 0}
          onClick={handleSave}
        >
          Зберегти {dirtyCount > 0 && `(${dirtyCount})`}
        </Button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [25, 50, 100, 200] }}
          size="small"
          scroll={{ y: 'calc(100vh - 360px)' }}
        />
      </div>
    </>
  )
}
