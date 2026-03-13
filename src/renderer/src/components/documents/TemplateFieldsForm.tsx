import { Form, Input } from 'antd'

// Human-readable labels for known template tags
const TAG_LABELS: Record<string, string> = {
  // Common
  unitName: 'Назва підрозділу',
  unitDesignation: 'Позначення в/ч',
  commanderRank: 'Звання командира',
  commanderName: 'ПІБ командира',
  // Order
  orderNumber: '№ наказу',
  orderDate: 'Дата наказу',
  subject: 'Предмет наказу',
  body: 'Текст наказу',
  // Leave ticket
  ticketNumber: '№ квитка',
  rankName: 'Звання',
  fullName: 'ПІБ',
  ipn: 'ІПН',
  positionTitle: 'Посада',
  subdivisionName: 'Підрозділ',
  leaveType: 'Тип відпустки',
  startDate: 'Дата початку',
  endDate: 'Дата закінчення',
  travelDays: 'Днів дороги',
  destination: 'Пункт призначення',
  // Injury
  injuryType: 'Вид поранення',
  dateOfInjury: 'Дата поранення',
  location: 'Місце',
  circumstances: 'Обставини',
  forma100Number: '№ Форма 100',
  forma100Date: 'Дата Форма 100',
  hospitalName: 'Медичний заклад'
}

// Tags that are auto-filled from settings
const AUTO_SETTINGS_TAGS = new Set([
  'unitName',
  'unitDesignation',
  'commanderRank',
  'commanderName'
])

// Tags auto-filled from personnel
const AUTO_PERSONNEL_TAGS = new Set(['fullName', 'ipn'])

interface Props {
  tags: string[]
  hasPersonnel: boolean
}

export default function TemplateFieldsForm({ tags, hasPersonnel }: Props): JSX.Element {
  // Filter out tags that are auto-filled
  const manualTags = tags.filter((tag) => {
    if (AUTO_SETTINGS_TAGS.has(tag)) return false
    if (hasPersonnel && AUTO_PERSONNEL_TAGS.has(tag)) return false
    return true
  })

  const autoTags = tags.filter(
    (tag) =>
      AUTO_SETTINGS_TAGS.has(tag) || (hasPersonnel && AUTO_PERSONNEL_TAGS.has(tag))
  )

  return (
    <>
      {autoTags.length > 0 && (
        <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: 13 }}>
          Автозаповнення: {autoTags.map((t) => TAG_LABELS[t] ?? t).join(', ')}
        </div>
      )}
      {manualTags.map((tag) => {
        const label = TAG_LABELS[tag] ?? tag
        const isMultiline = tag === 'body' || tag === 'circumstances'
        return (
          <Form.Item key={tag} name={['fields', tag]} label={label}>
            {isMultiline ? (
              <Input.TextArea rows={4} placeholder={label} />
            ) : (
              <Input placeholder={label} />
            )}
          </Form.Item>
        )
      })}
    </>
  )
}
