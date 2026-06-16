import { Card, Progress, Typography, Space, Tag } from 'antd'
import { TeamOutlined, IdcardOutlined } from '@ant-design/icons'
import type { SubdivisionTreeNode } from '@shared/types/position'

const { Text } = Typography

interface SubdivisionCardProps {
  node: SubdivisionTreeNode
  onClick?: () => void
  selected?: boolean
}

export default function SubdivisionCard({ node, onClick, selected }: SubdivisionCardProps) {
  const fillPercent =
    node.positionCount > 0 ? Math.round((node.personnelCount / node.positionCount) * 100) : 0

  const progressColor = fillPercent >= 80 ? '#52c41a' : fillPercent >= 50 ? '#faad14' : '#ff4d4f'

  return (
    <Card
      size="small"
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        borderColor: selected ? '#1677ff' : undefined,
        borderWidth: selected ? 2 : 1,
        marginBottom: 8
      }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space>
          <Tag color="blue">{node.code}</Tag>
          <Text strong>{node.name}</Text>
        </Space>
        {node.fullName && node.fullName !== node.name && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {node.fullName}
          </Text>
        )}
        <Space size="large">
          <Space size={4}>
            <TeamOutlined />
            <Text>ОС: {node.personnelCount}</Text>
          </Space>
          <Space size={4}>
            <IdcardOutlined />
            <Text>Посад: {node.positionCount}</Text>
          </Space>
          {node.vacantCount > 0 && (
            <Tag color="orange">Вакантних: {node.vacantCount}</Tag>
          )}
        </Space>
        {node.positionCount > 0 && (
          <Progress
            percent={fillPercent}
            size="small"
            strokeColor={progressColor}
            format={() => `${node.personnelCount}/${node.positionCount}`}
          />
        )}
      </Space>
    </Card>
  )
}
