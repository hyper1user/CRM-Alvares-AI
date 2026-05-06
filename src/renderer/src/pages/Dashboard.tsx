import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, Tooltip } from 'antd'
import {
  PrinterOutlined,
  DownloadOutlined,
  PlusOutlined,
  RightOutlined,
  SwapOutlined,
  TagOutlined,
  FileTextOutlined,
  FormOutlined,
  ImportOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useStatisticsSummary, useStatisticsByStatus } from '../hooks/useStatistics'
import { useMovementList } from '../hooks/useMovements'
import { usePersonnelList } from '../hooks/usePersonnel'
import { useLookups } from '../hooks/useLookups'
import type { SubdivisionTreeNode } from '@shared/types/position'
import { buildCompanyTree } from '@shared/utils/company-structure'

type Cat = 'duty' | 'combat' | 'medical' | 'leave' | 'absent' | 'other'

const CAT_COLORS: Record<Cat, string> = {
  duty: 'oklch(0.74 0.13 158)',
  combat: 'oklch(0.65 0.18 25)',
  medical: 'oklch(0.70 0.11 305)',
  leave: 'oklch(0.72 0.10 230)',
  absent: 'oklch(0.60 0.05 60)',
  other: 'oklch(0.45 0.005 70)',
}

const CAT_LABELS: Record<Cat, string> = {
  duty: 'На ППД',
  combat: 'На позиціях',
  medical: 'Медичні',
  leave: 'Відпустки',
  absent: 'Відсутні',
  other: 'Інші',
}

// v1.2.1: «бойове розташування» більше не hardcoded {РВ,РЗ,РШ}, а читається
// з status_types.isCombat — щоб юзер додавав нові коди (РОП «На позиції»…)
// без зміни коду додатку. categorize() тепер чистий від hardcoded списку.
function categorize(code: string, group: string, combatCodes: Set<string>): Cat {
  if (group === 'Лікування') return 'medical'
  if (group === 'Відпустка' || group === 'Відрядження') return 'leave'
  if (
    group === 'Загиблі' ||
    group === 'Зниклі безвісти' ||
    group === 'Полон' ||
    group === 'СЗЧ' ||
    group === 'Ні'
  )
    return 'absent'
  if (group === 'Так') return combatCodes.has(code) ? 'combat' : 'duty'
  return 'other'
}

function pct(value: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function KpiCard({
  label,
  value,
  footnote,
  accent,
  onClick,
  title,
}: {
  label: string
  value: number
  footnote?: string
  accent?: string
  onClick?: () => void
  title?: string
}): JSX.Element {
  const clickable = typeof onClick === 'function'
  return (
    <div
      className={'card kpi-card' + (clickable ? ' clickable' : '')}
      style={{ padding: 14 }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      title={title}
    >
      <div className="kpi">
        <div className="label">{label}</div>
        <div className="value" style={accent ? { color: accent } : undefined}>
          {value.toLocaleString('uk-UA')}
        </div>
        {footnote && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--fg-3)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              marginTop: 2,
            }}
          >
            {footnote}
          </div>
        )}
      </div>
    </div>
  )
}

function OrgTreeMini({ tree }: { tree: SubdivisionTreeNode[] }): JSX.Element {
  const navigate = useNavigate()
  // Знаходимо root для 12 ШР (Г-3)
  const root = tree.find((n) => n.code === 'Г-3') ?? tree[0]
  if (!root) {
    return <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>Орг-структура недоступна</div>
  }
  const rootCount = root.personnelCount ?? 0
  const children = root.children ?? []
  const maxCount = Math.max(...children.map((c) => c.personnelCount || 0), 1)

  const goToPlatoon = (code: string | null) => {
    if (code === 'Г-3.6') {
      // Виключені мають окрему сторінку — Реєстр фільтрує лише active.
      navigate('/personnel/excluded')
      return
    }
    if (code) navigate(`/personnel?platoon=${encodeURIComponent(code)}`)
    else navigate('/personnel')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        className="org-node root clickable"
        role="button"
        tabIndex={0}
        onClick={() => goToPlatoon(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            goToPlatoon(null)
          }
        }}
        title="Відкрити Реєстр всієї роти"
      >
        <TeamOutlined style={{ color: 'var(--accent)' }} />
        <div className="ttl">{root.name}</div>
        <span className="ct mono">{rootCount}</span>
      </div>
      <div
        style={{
          paddingLeft: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 7,
            top: 0,
            bottom: 14,
            width: 1,
            background: 'var(--line-1)',
          }}
        />
        {children.map((c) => {
          const ct = c.personnelCount || 0
          const fillPct = Math.max(4, Math.min(100, (ct / maxCount) * 100))
          return (
            <div key={c.id} style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: -7,
                  top: 18,
                  width: 14,
                  height: 1,
                  background: 'var(--line-1)',
                }}
              />
              <div
                className="org-node clickable"
                role="button"
                tabIndex={0}
                onClick={() => goToPlatoon(c.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    goToPlatoon(c.code)
                  }
                }}
                title={`Відкрити Реєстр: ${c.name}`}
              >
                <span className="mono dim" style={{ fontSize: 11 }}>
                  {c.code}
                </span>
                <div className="ttl">{c.name}</div>
                <span className="ct mono">{ct}</span>
                <div className="bar-track" style={{ width: 60, marginLeft: 6 }}>
                  <i style={{ width: `${fillPct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const QUICK_ACTIONS: Array<{ icon: JSX.Element; label: string; sub: string; to: string }> = [
  {
    icon: <PlusOutlined />,
    label: 'Додати бійця',
    sub: 'Новий запис у реєстр',
    to: '/personnel?new=1',
  },
  {
    icon: <SwapOutlined />,
    label: 'Переміщення',
    sub: 'Зміна посади / підрозділу',
    to: '/movements',
  },
  {
    icon: <TagOutlined />,
    label: 'Зміна статусу',
    sub: 'Каскадна зміна',
    to: '/statuses',
  },
  {
    icon: <FormOutlined />,
    label: 'Згенерувати наказ',
    sub: 'Word-документ',
    to: '/documents/generate',
  },
  {
    icon: <FileTextOutlined />,
    label: 'Стройова записка',
    sub: 'Snapshot на сьогодні',
    to: '/formation-report',
  },
  {
    icon: <ImportOutlined />,
    label: 'Імпорт ЕЖООС',
    sub: '.xlsx → БД',
    to: '/import-export',
  },
]

type DonutPeriod = 'now' | '7d' | '30d'

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const [donutPeriod, setDonutPeriod] = useState<DonutPeriod>('now')
  const donutDateAt = useMemo<string | undefined>(() => {
    if (donutPeriod === 'now') return undefined
    const days = donutPeriod === '7d' ? 7 : 30
    return dayjs().subtract(days, 'day').format('YYYY-MM-DD')
  }, [donutPeriod])

  const { data: summary, loading: summaryLoading } = useStatisticsSummary()
  const { data: byStatus } = useStatisticsByStatus(donutDateAt)
  const { data: movements } = useMovementList({})
  const { statusTypes } = useLookups()
  const combatCodes = useMemo(
    () => new Set(statusTypes.filter((s) => s.isCombat).map((s) => s.code)),
    [statusTypes]
  )
  // v0.8.3 → v0.8.5: дерево орг-структури 12 ШР будується на льоту з ОС роти.
  // Без subdivision filter — щоб у 5-й взвод (Розпорядження) потрапляли
  // ті, у кого `currentSubdivision='розпорядження'` (вони фактично з 12 ШР,
  // тільки тимчасово без штатної посади). Інших підрозділів у БД немає,
  // тож зайвих ОС не приходить.
  const { data: rotaPersonnel } = usePersonnelList({ status: 'active' })
  const { data: excludedPersonnel } = usePersonnelList({ status: 'excluded' })
  const tree = useMemo<SubdivisionTreeNode[]>(
    () => [buildCompanyTree([...rotaPersonnel, ...excludedPersonnel])],
    [rotaPersonnel, excludedPersonnel]
  )

  // Агрегація 21 статусу у 6 категорій
  const byCat = useMemo<Record<Cat, number>>(() => {
    const acc: Record<Cat, number> = {
      duty: 0,
      combat: 0,
      medical: 0,
      leave: 0,
      absent: 0,
      other: 0,
    }
    for (const s of byStatus) {
      acc[categorize(s.statusCode, s.groupName, combatCodes)] += s.count
    }
    return acc
  }, [byStatus, combatCodes])

  if (summaryLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const total = summary.totalPersonnel
  const totalPositions = summary.totalPositions
  // "В наявності" = усі з groupName='Так' (duty + combat). Так табельно вважається
  // присутність на службі, незалежно від того, на ППД боєць чи на бойовому виході.
  // "Відсутні" = total - В наявності — гарантує інваріант "За списком = В наявності + Відсутні",
  // навіть якщо в byCat не потрапили ОС без статусу (other).
  const present = byCat.duty + byCat.combat
  const missing = Math.max(0, total - present)
  const manning = totalPositions ? Math.round((total / totalPositions) * 100) : 0
  // Для donut'а на дату: сума по категоріях (може != поточному total —
  // ОС могла бути додана/виключена з тих пір).
  const donutTotal = (Object.values(byCat) as number[]).reduce((a, b) => a + b, 0)
  const donutData = (
    [
      { cat: 'duty' as Cat, v: byCat.duty },
      { cat: 'combat' as Cat, v: byCat.combat },
      { cat: 'medical' as Cat, v: byCat.medical },
      { cat: 'leave' as Cat, v: byCat.leave },
      { cat: 'absent' as Cat, v: byCat.absent },
      { cat: 'other' as Cat, v: byCat.other },
    ] as const
  ).filter((d) => d.v > 0)

  const recentMovements = movements.slice(0, 8)
  const today = dayjs()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Page header */}
      <div className="page-header">
        <div className="titles">
          <div className="eyebrow">
            {today.format('DD.MM.YYYY · HH:mm')} · станом на ранкову повірку
          </div>
          <h1>Зведення по роті</h1>
          <div className="sub">
            12 ШР · 4 ШБ · 92 ОШБр · {total} осіб у списках
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => window.print()}>
            <PrinterOutlined />
            Друк
          </button>
          <button className="btn" onClick={() => navigate('/import-export')}>
            <DownloadOutlined />
            Експорт
          </button>
          <button className="btn primary" onClick={() => navigate('/formation-report')}>
            <PlusOutlined />
            Стройова записка
          </button>
        </div>
      </div>

      {/* KPI row — 4 cards: за штатом / за списком / в наявності / відсутні */}
      <div className="hgrid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiCard
          label="За штатом"
          value={totalPositions}
          footnote="штатних посад"
          onClick={() => navigate('/positions')}
          title="Відкрити перелік штатних посад"
        />
        <KpiCard
          label="За списком"
          value={total}
          footnote={`укомпл. ${manning}%`}
          onClick={() => navigate('/personnel')}
          title="Відкрити Реєстр особового складу"
        />
        <KpiCard
          label="В наявності"
          value={present}
          footnote={`${pct(present, total)} списку`}
          accent={CAT_COLORS.duty}
          onClick={() => navigate('/personnel?presence=present')}
          title="Реєстр: ОС зі статусом присутності «Так»"
        />
        <KpiCard
          label="Відсутні"
          value={missing}
          footnote={`${pct(missing, total)} списку`}
          accent={CAT_COLORS.absent}
          onClick={() => navigate('/personnel?presence=missing')}
          title="Реєстр: шпиталь, відпустки, відрядження, СЗЧ тощо"
        />
      </div>

      {/* Row: donut + org-tree */}
      <div className="hgrid" style={{ gridTemplateColumns: '2fr 1.1fr' }}>
        <div className="card">
          <div className="card-head">
            <h3>Розподіл за статусами</h3>
            <div className="seg-control">
              <button
                className={donutPeriod === 'now' ? 'on' : ''}
                onClick={() => setDonutPeriod('now')}
                title="Поточний снапшот"
              >
                Зараз
              </button>
              <button
                className={donutPeriod === '7d' ? 'on' : ''}
                onClick={() => setDonutPeriod('7d')}
                title={`Стан на ${dayjs().subtract(7, 'day').format('DD.MM.YYYY')}`}
              >
                7 днів
              </button>
              <button
                className={donutPeriod === '30d' ? 'on' : ''}
                onClick={() => setDonutPeriod('30d')}
                title={`Стан на ${dayjs().subtract(30, 'day').format('DD.MM.YYYY')}`}
              >
                30 днів
              </button>
            </div>
          </div>
          <div
            className="card-body"
            style={{
              display: 'grid',
              gridTemplateColumns: '170px 1fr',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative', width: 170, height: 170 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="v"
                    nameKey="cat"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={75}
                    paddingAngle={1}
                    stroke="none"
                  >
                    {donutData.map((d) => (
                      <Cell key={d.cat} fill={CAT_COLORS[d.cat]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--fg-3)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {donutPeriod === 'now'
                      ? 'ВСЬОГО'
                      : dayjs().subtract(donutPeriod === '7d' ? 7 : 30, 'day').format('DD.MM.YY')}
                  </div>
                  <div
                    className="tnum"
                    style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}
                  >
                    {donutPeriod === 'now' ? total : donutTotal}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {(Object.keys(CAT_LABELS) as Cat[]).map((cat) => {
                const v = byCat[cat]
                return (
                  <div
                    key={cat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 4,
                      background: 'var(--bg-2)',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: CAT_COLORS[cat],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 12 }}>{CAT_LABELS[cat]}</span>
                    <span className="mono tnum" style={{ fontWeight: 600 }}>
                      {v}
                    </span>
                    <span className="mono dim" style={{ fontSize: 11 }}>
                      {pct(v, donutPeriod === 'now' ? total : donutTotal)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Орг-структура · 12 ШР</h3>
            <span className="meta">за поточний момент</span>
          </div>
          <div className="card-body">
            <OrgTreeMini tree={tree} />
          </div>
        </div>
      </div>

      {/* Row: recent movements + quick actions */}
      <div className="hgrid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <h3>Останні переміщення</h3>
            <button className="btn sm ghost" onClick={() => navigate('/movements')}>
              Всі
              <RightOutlined style={{ fontSize: 10 }} />
            </button>
          </div>
          <div className="card-body">
            {recentMovements.length === 0 ? (
              <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>Переміщень немає</div>
            ) : (
              <div className="timeline-rail">
                {recentMovements.map((m) => {
                  const when = m.dateFrom ? dayjs(m.dateFrom) : null
                  const isNow = when && when.isSame(today, 'day')
                  return (
                    <div key={m.id} className={'tl-item' + (isNow ? ' now' : '')}>
                      <div className="when mono">
                        {when ? when.format('DD.MM · HH:mm') : '—'}
                      </div>
                      <div className="what">
                        <b style={{ color: 'var(--accent)' }}>{m.fullName}</b> —{' '}
                        {m.orderType}
                      </div>
                      <div className="who">
                        {m.previousPositionTitle ?? 'без посади'} →{' '}
                        {m.positionTitle ?? '—'}
                        {m.subdivisionCode ? ` · ${m.subdivisionCode}` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Швидкі дії</h3>
          </div>
          <div
            className="card-body"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
          >
            {QUICK_ACTIONS.map((a) => (
              <Tooltip key={a.label} title={a.sub} placement="top">
                <button
                  onClick={() => navigate(a.to)}
                  style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line-1)',
                    borderRadius: 6,
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--fg-0)',
                    fontFamily: 'inherit',
                    transition: 'background 80ms, border-color 80ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-3)'
                    e.currentTarget.style.borderColor = 'var(--line-3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-2)'
                    e.currentTarget.style.borderColor = 'var(--line-1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        background: 'var(--bg-3)',
                        borderRadius: 4,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    >
                      {a.icon}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{a.label}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--fg-3)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.sub}
                      </div>
                    </div>
                  </div>
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
