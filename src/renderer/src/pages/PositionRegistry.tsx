import { Typography, Card } from 'antd'
import { BankOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function PositionRegistry(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <BankOutlined /> Перелік посад
      </Title>
      <Paragraph type="secondary">
        Всі посади з їх індексами, категоріями та статусами. Управління посадами та їх параметрами. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
