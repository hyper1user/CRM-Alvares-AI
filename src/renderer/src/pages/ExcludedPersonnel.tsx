import { Typography, Card } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function ExcludedPersonnel(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <DeleteOutlined /> Виключені
      </Title>
      <Paragraph type="secondary">
        Список виключених з особового складу військовослужбовців з причинами та датами виключення. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
