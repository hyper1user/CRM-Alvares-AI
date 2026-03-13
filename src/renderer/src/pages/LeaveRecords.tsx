import { Typography, Card } from 'antd'
import { holidays } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function LeaveRecords(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        📅 Відпустки
      </Title>
      <Paragraph type="secondary">
        Облік відпусток з датами, видами та затвердженнями. Можливість планування та контролю відпусток. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
