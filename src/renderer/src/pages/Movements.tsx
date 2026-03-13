import { Typography, Card } from 'antd'
import { SwapOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Movements(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <SwapOutlined /> Переміщення
      </Title>
      <Paragraph type="secondary">
        Історія переміщень військовослужбовців з можливістю додавання нових, ланцюжком та часовою шкалою. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
