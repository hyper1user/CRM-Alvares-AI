import { Typography, Card } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function MonthlyAttendance(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <CalendarOutlined /> Місячний табель
      </Title>
      <Paragraph type="secondary">
        Табель обліку присутності військовослужбовців з можливістю позначення днів та генерації звітів. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
