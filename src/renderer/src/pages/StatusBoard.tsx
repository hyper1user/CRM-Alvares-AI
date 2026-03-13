import { Typography, Card } from 'antd'
import { SwitcherOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function StatusBoard(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <SwitcherOutlined /> Статуси
      </Title>
      <Paragraph type="secondary">
        Kanban дошка статусів військовослужбовців з можливістю перетягування та перегляду каскаду статусів. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
