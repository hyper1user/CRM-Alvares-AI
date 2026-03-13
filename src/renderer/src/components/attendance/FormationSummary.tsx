import { Table, Tag, Card, Row, Col, Statistic } from 'antd'
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { FormationReportData } from '@shared/types/attendance'

interface FormationSummaryProps {
  data: FormationReportData
}

export default function FormationSummary({ data }: FormationSummaryProps): JSX.Element {
  const totalPresent = data.groups
    .filter((g) => g.groupName === 'Так')
    .reduce((sum, g) => sum + g.count, 0)
  const totalAbsent = data.totalActive - totalPresent

  // Group statuses by groupName
  const groupedStatuses = new Map<string, typeof data.groups>()
  for (const g of data.groups) {
    if (!groupedStatuses.has(g.groupName)) groupedStatuses.set(g.groupName, [])
    groupedStatuses.get(g.groupName)!.push(g)
  }

  const statusColumns = [
    {
      title: 'Код',
      dataIndex: 'statusCode',
      width: 140
    },
    {
      title: 'Статус',
      dataIndex: 'statusName',
      render: (text: string, record: (typeof data.groups)[0]) => (
        <Tag color={record.colorCode || 'default'}>{text}</Tag>
      )
    },
    {
      title: 'Кількість',
      dataIndex: 'count',
      width: 100,
      align: 'center' as const
    },
    {
      title: '%',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: (typeof data.groups)[0]) =>
        data.totalActive > 0
          ? `${((record.count / data.totalActive) * 100).toFixed(1)}%`
          : '—'
    }
  ]

  const subdivisionColumns = [
    {
      title: 'Підрозділ',
      dataIndex: 'name',
      render: (text: string, record: (typeof data.bySubdivision)[0]) => (
        <span>
          <span style={{ color: '#888', marginRight: 6 }}>{record.code}</span>
          {text}
        </span>
      )
    },
    {
      title: 'Штат',
      dataIndex: 'total',
      width: 80,
      align: 'center' as const
    },
    {
      title: 'Наявні',
      dataIndex: 'present',
      width: 80,
      align: 'center' as const,
      render: (v: number) => <span style={{ color: 'green' }}>{v}</span>
    },
    {
      title: 'Відсутні',
      dataIndex: 'absent',
      width: 80,
      align: 'center' as const,
      render: (v: number) => <span style={{ color: v > 0 ? 'red' : 'inherit' }}>{v}</span>
    },
    {
      title: '%',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: (typeof data.bySubdivision)[0]) =>
        record.total > 0
          ? `${((record.present / record.total) * 100).toFixed(0)}%`
          : '—'
    }
  ]

  return (
    <div>
      {/* Summary cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Всього активних"
              value={data.totalActive}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Наявні"
              value={totalPresent}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Відсутні"
              value={totalAbsent}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* By statuses */}
        <Col span={14}>
          <Card title="По статусах" size="small">
            {Array.from(groupedStatuses.entries()).map(([groupName, items]) => (
              <div key={groupName} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 4,
                    padding: '4px 8px',
                    background: '#fafafa',
                    borderRadius: 4
                  }}
                >
                  {groupName} ({items.reduce((s, i) => s + i.count, 0)})
                </div>
                <Table
                  dataSource={items}
                  columns={statusColumns}
                  rowKey="statusCode"
                  size="small"
                  pagination={false}
                  showHeader={false}
                />
              </div>
            ))}
          </Card>
        </Col>

        {/* By subdivisions */}
        <Col span={10}>
          <Card title="По підрозділах" size="small">
            <Table
              dataSource={data.bySubdivision}
              columns={subdivisionColumns}
              rowKey="code"
              size="small"
              pagination={false}
              summary={(pageData) => {
                const totals = pageData.reduce(
                  (acc, row) => ({
                    total: acc.total + row.total,
                    present: acc.present + row.present,
                    absent: acc.absent + row.absent
                  }),
                  { total: 0, present: 0, absent: 0 }
                )
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Всього</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <strong>{totals.total}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <strong style={{ color: 'green' }}>{totals.present}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <strong style={{ color: 'red' }}>{totals.absent}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="center">
                      <strong>
                        {totals.total > 0
                          ? `${((totals.present / totals.total) * 100).toFixed(0)}%`
                          : '—'}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
