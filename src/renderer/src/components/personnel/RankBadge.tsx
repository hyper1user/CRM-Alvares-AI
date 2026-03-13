import { Tag } from 'antd'

const CATEGORY_COLORS: Record<string, string> = {
  'Офіцери': 'gold',
  'Сержанти': 'blue',
  'Солдати': 'green',
  'Працівники ЗСУ': 'default'
}

interface RankBadgeProps {
  rankName?: string | null
  category?: string | null
}

export default function RankBadge({ rankName, category }: RankBadgeProps) {
  if (!rankName) return <span style={{ color: '#999' }}>—</span>

  const color = (category && CATEGORY_COLORS[category]) || 'default'

  return <Tag color={color}>{rankName}</Tag>
}
