import { Typography, Card } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function StaffingTable(): JSX.Element {
  return (
    <Card>
      <Title level={3}>
        <FileTextOutlined /> Штатно-посадовий облік
      </Title>
      <Paragraph type="secondary">
        Таблиця штатів з посадами, посадовими вимогами та укомплектованістю. Аналіз наявних та вакантних позицій. Буде реалізовано у наступних тижнях.
      </Paragraph>
    </Card>
  )
}
