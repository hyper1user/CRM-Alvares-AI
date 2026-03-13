import { Timeline, Tag, Typography, Empty } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

interface StatusHistoryEntry {
  id: number
  statusCode: string
  statusName: string
  statusColor: string | null
  groupName: string
  dateFrom: string
  dateTo: string | null
  comment: string | null
  isLast: boolean
  presenceGroup: string | null
}

interface Props {
  statuses: StatusHistoryEntry[]
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return dayjs(d).format('DD.MM.YYYY')
}

export default function StatusTimeline({ statuses }: Props): JSX.Element {
  if (!statuses.length) {
    return <Empty description="Немає записів статусів" />
  }

  const items = statuses.map((s) => {
    const color = s.isLast ? (s.statusColor || 'green') : 'gray'

    return {
      key: s.id,
      color,
      children: (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag color={s.statusColor || 'default'}>{s.statusCode}</Tag>
            <Text strong>{s.statusName}</Text>
            {s.isLast && <Tag color="green" style={{ marginLeft: 8 }}>Поточний</Tag>}
          </div>
          <div>
            <Text type="secondary">
              {formatDate(s.dateFrom)}
              {s.dateTo ? ` — ${formatDate(s.dateTo)}` : ' — теперішній час'}
            </Text>
          </div>
          {s.groupName && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Група: {s.groupName}
              </Text>
            </div>
          )}
          {s.presenceGroup && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Присутність: {s.presenceGroup}
              </Text>
            </div>
          )}
          {s.comment && (
            <div>
              <Text type="secondary" italic style={{ fontSize: 12 }}>
                {s.comment}
              </Text>
            </div>
          )}
        </div>
      )
    }
  })

  return <Timeline items={items} />
}
