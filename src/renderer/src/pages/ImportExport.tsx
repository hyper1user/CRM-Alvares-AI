import { Typography, Card } from 'antd'
import { CloudDownloadOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function ImportExport(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <CloudDownloadOutlined /> Імпорт / Експорт
      </Title>
      <Paragraph type="secondary">
        Імпорт даних з ЕЖООС.xlsx та Data.xlsx. Експорт всіх даних у форматах Excel, Word, CSV. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
