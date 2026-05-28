import { Timeline, Tag, Typography, Empty } from 'antd'
import dayjs from 'dayjs'
import type { Movement } from '@shared/types/movement'

const { Text } = Typography

interface MovementWithTitles extends Movement {
  positionTitle: string | null
  previousPositionTitle: string | null
}

interface Props {
  movements: MovementWithTitles[]
}

const ORDER_TYPE_COLORS: Record<string, string> = {
  'Переміщення': 'blue',
  'В розпорядження': 'orange',
  'Прикомандирування': 'purple',
  'Переведення': 'cyan',
  'Зарахування': 'green',
  'Виключення': 'red',
  'Відновлення': 'lime'
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return dayjs(d).format('DD.MM.YYYY')
}

export default function MovementTimeline({ movements }: Props): JSX.Element {
  if (!movements.length) {
    return <Empty description="Немає переміщень" />
  }

  const items = movements.map((m) => {
    const color = m.isActive ? 'green' : 'gray'
    const tagColor = ORDER_TYPE_COLORS[m.orderType] ?? 'default'

    return {
      key: m.id,
      color,
      children: (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag color={tagColor}>{m.orderType}</Tag>
            {m.isActive && <Tag color="green">Активне</Tag>}
          </div>
          <div>
            <Text strong>
              {m.positionTitle || m.positionIndex || '—'}
            </Text>
            {m.previousPositionTitle || m.previousPosition ? (
              <Text type="secondary">
                {' '}
                (з: {m.previousPositionTitle || m.previousPosition})
              </Text>
            ) : null}
          </div>
          <div>
            <Text type="secondary">
              {formatDate(m.dateFrom)}
              {m.dateTo ? ` — ${formatDate(m.dateTo)}` : ''}
            </Text>
          </div>
          {(m.orderNumber || m.orderIssuer) && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {[m.orderIssuer, m.orderNumber ? `№${m.orderNumber}` : null, m.orderDate ? `від ${formatDate(m.orderDate)}` : null]
                  .filter(Boolean)
                  .join(' ')}
              </Text>
            </div>
          )}
          {m.notes && (
            <div>
              <Text type="secondary" italic style={{ fontSize: 12 }}>
                {m.notes}
              </Text>
            </div>
          )}
        </div>
      )
    }
  })

  return <Timeline items={items} />
}
