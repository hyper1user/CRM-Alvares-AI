import { Typography, Card } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function FormationReport(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <LineChartOutlined /> Стройова записка
      </Title>
      <Paragraph type="secondary">
        Щоденний звіт про стан особового складу з розбором по статусах та підрозділах. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
