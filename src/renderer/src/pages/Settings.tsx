import { Typography, Card } from 'antd'
import { SettingOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Settings(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <SettingOutlined /> Налаштування
      </Title>
      <Paragraph type="secondary">
        Налаштування додатку, управління довідниками (ранги, статуси, підрозділи, посади), дані частини та інші системні параметри. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
