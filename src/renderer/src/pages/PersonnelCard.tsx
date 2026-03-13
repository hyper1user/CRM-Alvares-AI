import { Typography, Card } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function PersonnelCard(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <UserOutlined /> Картка особи
      </Title>
      <Paragraph type="secondary">
        Детальна інформація про військовослужбовця: персональні дані, контакти, poslужний список, статуси. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
