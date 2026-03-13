import { Typography, Card } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function DocumentGenerator(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <FileTextOutlined /> Генератор документів
      </Title>
      <Paragraph type="secondary">
        Створення документів на основі шаблонів з заповненням даних. Экпорт у Word, Excel, PDF. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
