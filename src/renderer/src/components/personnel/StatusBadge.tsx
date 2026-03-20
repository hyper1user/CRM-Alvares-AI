import { Tag } from 'antd'

interface StatusBadgeProps {
  statusCode?: string | null
  statusName?: string | null
  colorCode?: string | null
}

export default function StatusBadge({ statusCode, statusName, colorCode }: StatusBadgeProps) {
  if (!statusCode && !statusName) return <span style={{ color: '#999' }}>—</span>

  const color = colorCode || 'default'
  const label = statusName || statusCode || '—'

  return <Tag color={color}>{label}</Tag>
}
