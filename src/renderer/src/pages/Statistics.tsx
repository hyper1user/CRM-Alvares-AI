import { Typography, Card } from 'antd'
import { AreaChartOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Statistics(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <AreaChartOutlined /> Статистика
      </Title>
      <Paragraph type="secondary">
        Графіки та звіти по особовому складу: розподіл по статусах, підрозділах, посадах, рангах. Аналітика та тренди. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
