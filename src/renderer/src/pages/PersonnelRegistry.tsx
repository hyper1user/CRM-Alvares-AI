import { Typography, Card } from 'antd'
import { TeamOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function PersonnelRegistry(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <TeamOutlined /> Реєстр особового складу
      </Title>
      <Paragraph type="secondary">
        Таблиця всіх військовослужбовців з пошуком, фільтрацією та можливістю редагування. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
