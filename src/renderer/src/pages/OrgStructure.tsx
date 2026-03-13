import { Typography, Card } from 'antd'
import { ApartmentOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function OrgStructure(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <ApartmentOutlined /> Організаційна структура
      </Title>
      <Paragraph type="secondary">
        Дерево підрозділів з їх складом та командиром. Навігація по структурі та перегляд складу кожного підрозділу. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
