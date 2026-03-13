import { Typography, Card } from 'antd'
import { WarningOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function InjuriesLosses(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <WarningOutlined /> Поранення та втрати
      </Title>
      <Paragraph type="secondary">
        Облік поранень та небойових втрат з датами та обставинами. Ведення статистики за період. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
