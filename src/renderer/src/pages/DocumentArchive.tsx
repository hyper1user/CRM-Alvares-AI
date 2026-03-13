import { Typography, Card } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function DocumentArchive(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <FolderOpenOutlined /> Архів документів
      </Title>
      <Paragraph type="secondary">
        Список всіх згенерованих документів з можливістю пошуку, перегляду та видалення. Архівування та експорт. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
