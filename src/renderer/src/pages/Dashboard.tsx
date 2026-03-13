import { Row, Col, Card, Statistic, Spin } from 'antd'
import {
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SolutionOutlined
} from '@ant-design/icons'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useStatisticsSummary, useStatisticsBySubdivision } from '../hooks/useStatistics'

const CATEGORY_COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1']

export default function Dashboard(): JSX.Element {
  const { data: summary, loading: summaryLoading } = useStatisticsSummary()
  const { data: subdivisionData, loading: subLoading } = useStatisticsBySubdivision()

  if (summaryLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Row 1 — Summary cards */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Особовий склад"
              value={summary.totalPersonnel}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="На забезпеченні"
              value={summary.onSupplyCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Не на забезпеченні"
              value={summary.offSupplyCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Вакансії"
              value={summary.vacantPositions}
              suffix={`/ ${summary.totalPositions}`}
              prefix={<SolutionOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2 — Two charts */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Розподіл по групах статусів">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary.byGroup}
                  dataKey="count"
                  nameKey="groupName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ groupName, count }) => `${groupName}: ${count}`}
                >
                  {summary.byGroup.map((entry, i) => (
                    <Cell key={i} fill={entry.color ?? '#999'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Розподіл по категоріях">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Кількість">
                  {summary.byCategory.map((_entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 3 — Subdivision chart */}
      <Card title="Особовий склад по підрозділах" loading={subLoading}>
        <ResponsiveContainer width="100%" height={Math.max(300, subdivisionData.length * 36)}>
          <BarChart data={subdivisionData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="subdivisionName" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="onSupply" name="На забезпеченні" stackId="a" fill="#52c41a" />
            <Bar dataKey="offSupply" name="Не на забезпеченні" stackId="a" fill="#faad14" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
