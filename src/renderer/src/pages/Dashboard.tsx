import { Typography, Card } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Dashboard(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <BarChartOutlined /> Головна панель
      </Title>
      <Paragraph type="secondary">
        Дашборд з загальною статистикою. Зведені дані за ОС, статусами, переміщеннями та ключові показники. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
