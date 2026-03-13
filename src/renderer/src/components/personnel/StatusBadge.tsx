import { Tag } from 'antd'

// Default colors for known status codes
const STATUS_COLORS: Record<string, string> = {
  IN_SUPPLY: 'green',
  ANNUAL_LEAVE: 'blue',
  FAMILY_LEAVE: 'blue',
  MEDICAL_LEAVE: 'cyan',
  HOSPITALIZED: 'orange',
  REHABILITATION: 'orange',
  BUSINESS_TRIP: 'purple',
  TRAINING: 'purple',
  COMBAT_MISSION: 'red',
  AWOL: 'red',
  CAPTURED: 'volcano',
  MISSING: 'volcano',
  KIA: '#000',
  EXCLUDED: 'default'
}

interface StatusBadgeProps {
  statusCode?: string | null
  statusName?: string | null
  colorCode?: string | null
}

export default function StatusBadge({ statusCode, statusName, colorCode }: StatusBadgeProps) {
  if (!statusCode && !statusName) return <span style={{ color: '#999' }}>—</span>

  const color = colorCode || (statusCode && STATUS_COLORS[statusCode]) || 'default'
  const label = statusName || statusCode || '—'

  return <Tag color={color}>{label}</Tag>
}
