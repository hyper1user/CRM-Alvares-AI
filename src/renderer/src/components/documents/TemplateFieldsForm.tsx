import { Form, Input } from 'antd'

// Human-readable labels for known template tags (Latin + Cyrillic)
const TAG_LABELS: Record<string, string> = {
  // Common (Latin)
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
  hospitalName: 'Медичний заклад',

  // Cyrillic tags from real <<>> templates (шаблони/)
  // -- Доповіді / Рапорти --
  'ЗВ_ПІБ': 'Звання та ПІБ',
  'ЗВ_ПІБ_О': 'Звання, ПІБ (ознайомлений)',
  'ЗВ_ПІБ_Р': 'Звання, ПІБ (родинні)',
  'ЗВ_ПІБ_Д': 'Звання, ПІБ (давальний)',
  'ЗВ_ПІБ_ПОС': 'Звання, ПІБ, посада',
  'ЗВ_ПІБ_ПОС_Р': 'Звання, ПІБ, посада (родинні)',
  'ЗВ_ПІБ_ПОС_Д': 'Звання, ПІБ, посада (давальний)',
  'Дата': 'Дата',
  'Дата+1': 'Дата (наступний день)',
  'Дата_вп': 'Дата відпустки',
  'Дата_евакуації': 'Дата евакуації',
  'Дата_УБД': 'Дата посвідчення УБД',
  'Дата_події': 'Дата події',
  'Год_доп': 'Година доповіді',
  'Хв_доп': 'Хвилина доповіді',
  'Час_евакуації': 'Час евакуації',
  'Подія': 'Подія',
  'Діагноз': 'Діагноз',
  'Причина_поранення': 'Причина поранення',
  'Стадія_евакуації': 'Стадія евакуації',
  'Зброя': 'Зброя',
  'Місце_зброї': 'Місцезнаходження зброї',
  'Інформація': 'Додаткова інформація',
  'Морг': 'Морг',
  'місце_моргу': 'Місце моргу',
  'Вид_служби': 'Вид служби',
  'Склад': 'Склад',
  'Адреса_проживання': 'Адреса проживання',
  'Телефон': 'Телефон',
  'Посада': 'Посада',
  'Звання': 'Звання',
  'Підпис': 'Підпис',
  'РАПОРТ_КОГО': 'Рапорт від кого',
  'Серія_УБД': 'Серія УБД',
  'Номер_УБД': 'Номер УБД',
  // -- Загальні --
  'ПІБ': 'ПІБ',
  'ІПН': 'ІПН',
  'Підрозділ': 'Підрозділ',
  'Місце': 'Місце'
}

// Tags that are auto-filled from settings
const AUTO_SETTINGS_TAGS = new Set([
  'unitName',
  'unitDesignation',
  'commanderRank',
  'commanderName',
  'Назва частини',
  'Позначення частини',
  'Командир звання',
  'Командир ПІБ'
])

// Tags auto-filled from personnel
const AUTO_PERSONNEL_TAGS = new Set([
  'fullName',
  'ipn',
  'ПІБ',
  'ІПН'
])

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
        const isMultiline = tag === 'body' || tag === 'circumstances' ||
          tag === 'Текст наказу' || tag === 'Обставини'
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
