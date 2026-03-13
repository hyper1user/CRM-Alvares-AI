import { useState, useMemo } from 'react'
import { Card, Tree, Space, Tag, Typography, Progress, Table, Empty, Spin } from 'antd'
import { ApartmentOutlined, TeamOutlined, IdcardOutlined } from '@ant-design/icons'
import { useSubdivisionTree, usePositionList } from '../hooks/usePositions'
import SubdivisionCard from '../components/positions/SubdivisionCard'
import type { SubdivisionTreeNode, PositionListItem } from '@shared/types/position'

const { Title, Text } = Typography

// Convert SubdivisionTreeNode to Ant Design Tree data
function toTreeData(
  nodes: SubdivisionTreeNode[]
): { key: string; title: React.ReactNode; children: ReturnType<typeof toTreeData>; data: SubdivisionTreeNode }[] {
  return nodes.map((node) => ({
    key: String(node.id),
    title: (
      <Space>
        <Tag color="blue">{node.code}</Tag>
        <Text strong>{node.name}</Text>
        <Text type="secondary">
          (ОС: {node.personnelCount} / Посад: {node.positionCount}
          {node.vacantCount > 0 ? ` / Вакантних: ${node.vacantCount}` : ''})
        </Text>
      </Space>
    ),
    children: toTreeData(node.children),
    data: node
  }))
}

// Flatten tree to find node by id
function findNode(nodes: SubdivisionTreeNode[], id: number): SubdivisionTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return null
}

export default function OrgStructure(): JSX.Element {
  const { data: treeData, loading: treeLoading } = useSubdivisionTree()
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null)

  const selectedNode = useMemo(
    () => (selectedSubId ? findNode(treeData, selectedSubId) : null),
    [treeData, selectedSubId]
  )

  // Fetch positions for selected subdivision
  const { data: positionData, loading: posLoading } = usePositionList(
    selectedSubId ? { subdivisionId: selectedSubId } : {}
  )

  // Summary totals across all nodes
  const allNodes = useMemo(() => {
    const flat: SubdivisionTreeNode[] = []
    const traverse = (nodes: SubdivisionTreeNode[]) => {
      for (const n of nodes) {
        flat.push(n)
        traverse(n.children)
      }
    }
    traverse(treeData)
    return flat
  }, [treeData])

  const totalPersonnel = allNodes.reduce((s, n) => s + n.personnelCount, 0)
  const totalPositions = allNodes.reduce((s, n) => s + n.positionCount, 0)
  const totalVacant = allNodes.reduce((s, n) => s + n.vacantCount, 0)
  const fillPercent = totalPositions > 0 ? Math.round(((totalPositions - totalVacant) / totalPositions) * 100) : 0

  const antTreeData = useMemo(() => toTreeData(treeData), [treeData])

  const handleSelect = (keys: React.Key[]) => {
    const key = keys[0]
    setSelectedSubId(key ? Number(key) : null)
  }

  const posColumns = [
    { title: 'Індекс', dataIndex: 'positionIndex', width: 100 },
    { title: 'Посада', dataIndex: 'title', ellipsis: true },
    {
      title: 'Особа',
      key: 'occupant',
      width: 280,
      render: (_: unknown, r: PositionListItem) => {
        if (!r.isActive)
          return (
            <Text delete type="secondary">
              Деактивована
            </Text>
          )
        if (!r.occupantId) return <Tag color="orange">ВАКАНТНА</Tag>
        return (
          <Space size={4}>
            <Tag color="green">{r.occupantRank}</Tag>
            <span>{r.occupantName}</span>
          </Space>
        )
      }
    }
  ]

  if (treeLoading) {
    return (
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Left panel: Tree */}
      <div style={{ width: 420, flexShrink: 0 }}>
        {/* Unit summary card */}
        <Card size="small" style={{ marginBottom: 12 }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space>
              <ApartmentOutlined style={{ fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                12 ОШР "Хижаки"
              </Title>
            </Space>
            <Space size="large">
              <Space size={4}>
                <TeamOutlined />
                <Text>ОС: {totalPersonnel}</Text>
              </Space>
              <Space size={4}>
                <IdcardOutlined />
                <Text>Посад: {totalPositions}</Text>
              </Space>
              {totalVacant > 0 && <Tag color="orange">Вакантних: {totalVacant}</Tag>}
            </Space>
            {totalPositions > 0 && (
              <Progress
                percent={fillPercent}
                size="small"
                strokeColor={
                  fillPercent >= 80 ? '#52c41a' : fillPercent >= 50 ? '#faad14' : '#ff4d4f'
                }
                format={() => `${totalPositions - totalVacant}/${totalPositions}`}
              />
            )}
          </Space>
        </Card>

        {/* Tree */}
        <Card size="small" title="Підрозділи" style={{ overflow: 'auto' }}>
          <Tree
            treeData={antTreeData}
            defaultExpandAll
            selectedKeys={selectedSubId ? [String(selectedSubId)] : []}
            onSelect={handleSelect}
            blockNode
          />
        </Card>
      </div>

      {/* Right panel: Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedNode ? (
          <>
            <SubdivisionCard node={selectedNode} />
            <Card
              size="small"
              title={`Посади — ${selectedNode.code} ${selectedNode.name}`}
              style={{ marginTop: 8 }}
            >
              <Table
                columns={posColumns}
                dataSource={positionData}
                rowKey="id"
                size="small"
                loading={posLoading}
                pagination={false}
                rowClassName={(record: PositionListItem) => {
                  if (!record.isActive) return 'row-deactivated'
                  if (!record.occupantId) return 'row-vacant'
                  return ''
                }}
              />
            </Card>
          </>
        ) : (
          <Card style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Оберіть підрозділ зліва для перегляду деталей" />
          </Card>
        )}
      </div>

      <style>{`
        .row-vacant { background-color: #fffbe6 !important; }
        .row-vacant:hover > td { background-color: #fff7cc !important; }
        .row-deactivated { text-decoration: line-through; opacity: 0.6; }
      `}</style>
    </div>
  )
}
