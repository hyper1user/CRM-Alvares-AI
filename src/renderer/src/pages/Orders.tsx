import { Typography, Card } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Orders(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <FileProtectOutlined /> Накази
      </Title>
      <Paragraph type="secondary">
        Накази по особовому складу з реквізитами, номерами та датами. Можливість генерації та архівування. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
