import { useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Divider,
  App,
  Row,
  Col
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import IpnInput from './IpnInput'
import { useLookups } from '../../hooks/useLookups'
import type { Personnel } from '@shared/types/personnel'

interface PersonnelFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editRecord?: Personnel | null // null = create mode
}

export default function PersonnelForm({ open, onClose, onSaved, editRecord }: PersonnelFormProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { ranks, bloodTypes, contractTypes, educationLevels, subdivisions, positions, loading } =
    useLookups()
  const isEdit = !!editRecord

  useEffect(() => {
    if (!open) return

    if (editRecord) {
      // Populate form with existing data
      const values: Record<string, unknown> = { ...editRecord }
      // Convert date strings to dayjs for DatePicker
      const dateFields = [
        'dateOfBirth',
        'contractDate',
        'contractEndDate',
        'enrollmentDate',
        'enrollmentOrderDate',
        'rankOrderDate',
        'passportIssuedDate',
        'ubdDate',
        'conscriptionDate',
        'foreignPassportIssuedDate',
        'militaryIdIssuedDate',
        'driverLicenseExpiry',
        'driverLicenseIssuedDate',
        'tractorLicenseExpiry',
        'tractorLicenseIssuedDate',
        'basicTrainingDateFrom',
        'basicTrainingDateTo'
      ]
      for (const field of dateFields) {
        const val = values[field]
        values[field] = val ? dayjs(val as string) : null
      }
      form.setFieldsValue(values)
    } else {
      form.resetFields()
      form.setFieldValue('currentSubdivision', 'Г-3')
    }
  }, [open, editRecord, form])

  const handleAutoFill = (data: { dateOfBirth?: string; gender?: string }) => {
    if (data.dateOfBirth) {
      form.setFieldValue('dateOfBirth', dayjs(data.dateOfBirth))
    }
    if (data.gender) {
      form.setFieldValue('gender', data.gender)
    }
  }

  const handleSubmit = async () => {
    console.log('[PersonnelForm] handleSubmit called')

    let values
    try {
      values = await form.validateFields()
      console.log('[PersonnelForm] validateFields OK')
    } catch (validationErr) {
      console.warn('[PersonnelForm] validateFields FAILED:', validationErr)
      return
    }

    try {
      // Convert dayjs to strings; skip null/undefined (partial schema treats missing as "no change")
      const data: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(values)) {
        if (value && typeof value === 'object' && dayjs.isDayjs(value)) {
          data[key] = value.format('YYYY-MM-DD')
        } else if (value !== null && value !== undefined) {
          data[key] = value
        }
      }

      console.log('[PersonnelForm] IPC call, isEdit:', isEdit)
      let result: Record<string, unknown>
      if (isEdit && editRecord) {
        result = await window.api.personnelUpdate(editRecord.id, data)
      } else {
        result = await window.api.personnelCreate(data)
      }
      console.log('[PersonnelForm] IPC result:', result)

      if (result && 'error' in result && result.error) {
        const issues = (result as { issues: { message: string }[] }).issues
        message.error(issues?.map((i) => i.message).join(', ') || 'Помилка валідації')
        return
      }

      message.success(isEdit ? 'Дані оновлено' : 'Особу додано')
      onSaved()
      onClose()
    } catch (err) {
      console.error('[PersonnelForm] save error:', err)
      message.error('Помилка збереження: ' + String(err))
    }
  }

  const subdivisionOptions = subdivisions.map((s) => ({
    label: s.name,
    value: s.code
  }))

  const positionOptions = positions.map((p) => ({
    label: `${p.positionIndex} — ${p.title}`,
    value: p.positionIndex
  }))

  return (
    <Drawer
      title={isEdit ? 'Редагування особи' : 'Додавання особи'}
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Скасувати</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit}>
            Зберегти
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" size="middle" disabled={loading}>
        {/* === Основні дані === */}
        <Divider orientation="left">Основні дані</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="ipn"
              label="РНОКПП (ІПН)"
              rules={[{ required: true, message: "ІПН обов'язковий" }]}
            >
              <IpnInput onAutoFill={handleAutoFill} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dateOfBirth" label="Дата народження">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="gender" label="Стать">
              <Select
                allowClear
                options={[
                  { label: 'Чоловіча', value: 'ч' },
                  { label: 'Жіноча', value: 'ж' }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="lastName"
              label="Прізвище"
              rules={[{ required: true, message: "Прізвище обов'язкове" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="firstName"
              label="Ім'я"
              rules={[{ required: true, message: "Ім'я обов'язкове" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="patronymic" label="По батькові">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="callsign" label="Позивний">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="Телефон">
              <Input placeholder="+380..." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="personalNumber" label="Особовий номер">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* === Службові дані === */}
        <Divider orientation="left">Службові дані</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="rankId" label="Звання">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={ranks.map((r) => ({
                  label: r.name,
                  value: r.id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="serviceType" label="Вид служби">
              <Select
                allowClear
                options={[
                  { label: 'Строкова', value: 'строкова' },
                  { label: 'Контрактна', value: 'контрактна' },
                  { label: 'Мобілізація', value: 'мобілізація' },
                  { label: 'Кадрова', value: 'кадрова' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="contractTypeId" label="Тип контракту">
              <Select
                allowClear
                options={contractTypes.map((c) => ({
                  label: c.name,
                  value: c.id
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="contractDate" label="Дата контракту">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="contractEndDate" label="Закінчення контракту">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="currentSubdivision" label="Підрозділ">
              <Select allowClear showSearch optionFilterProp="label" options={subdivisionOptions} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="currentPositionIdx" label="Посада">
              <Select allowClear showSearch optionFilterProp="label" options={positionOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="currentStatusCode" label="Статус">
              <Select
                allowClear
                options={[
                  { label: 'На забезпеченні', value: 'IN_SUPPLY' },
                  { label: 'У відпустці', value: 'ANNUAL_LEAVE' },
                  { label: 'Госпіталізований', value: 'HOSPITALIZED' },
                  { label: 'Відрядження', value: 'BUSINESS_TRIP' },
                  { label: 'Навчання', value: 'TRAINING' }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="enrollmentDate" label="Дата зарахування">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="enrollmentOrderNum" label="Наказ зарахування">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="arrivedFrom" label="Звідки прибув">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="rankOrderDate" label="Дата наказу звання">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="rankOrderInfo" label="Наказ про звання">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* === Документи === */}
        <Divider orientation="left">Документи</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="idDocType" label="Тип ID-документа">
              <Select
                allowClear
                options={[
                  { label: 'ID-картка', value: 'id_card' },
                  { label: 'Паспорт (книжечка)', value: 'passport' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="idDocSeries" label="Серія ID">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="idDocNumber" label="Номер ID">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="passportSeries" label="Серія паспорта">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="passportNumber" label="Номер паспорта">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="passportIssuedBy" label="Ким виданий">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="passportIssuedDate" label="Дата видачі">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="militaryIdSeries" label="Серія військ. кв.">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="militaryIdNumber" label="Номер військ. кв.">
              <Input />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="ubdSeries" label="Серія УБД">
              <Input />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="ubdNumber" label="Номер УБД">
              <Input />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="ubdDate" label="Дата УБД">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* === Персональне === */}
        <Divider orientation="left">Персональне</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="bloodTypeId" label="Група крові">
              <Select
                allowClear
                options={bloodTypes.map((b) => ({
                  label: b.name,
                  value: b.id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="educationLevelId" label="Освіта">
              <Select
                allowClear
                options={educationLevels.map((e) => ({
                  label: e.name,
                  value: e.id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="maritalStatus" label="Сімейний стан">
              <Select
                allowClear
                options={[
                  { label: 'Одружений/Заміжня', value: 'одружений' },
                  { label: 'Неодружений/Незаміжня', value: 'неодружений' },
                  { label: 'Розлучений/а', value: 'розлучений' },
                  { label: 'Вдівець/Вдова', value: 'вдівець' }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="addressActual" label="Адреса фактична">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="addressRegistered" label="Адреса реєстрації">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="birthplace" label="Місце народження">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="educationInstitution" label="Навч. заклад">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="relativesInfo" label="Родичі (ПІБ, контакти)">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="notes" label="Примітки">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>

        {/* === Додаткові документи === */}
        <Divider orientation="left">Додаткові документи</Divider>

        {/* Закордонний паспорт */}
        <Divider orientation="left" plain style={{ fontSize: 13, color: '#8c8c8c' }}>Закордонний паспорт</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="foreignPassportSeries" label="Серія">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="foreignPassportNumber" label="Номер">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="foreignPassportIssuedBy" label="Ким виданий">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="foreignPassportIssuedDate" label="Дата видачі">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* Фінансові дані */}
        <Divider orientation="left" plain style={{ fontSize: 13, color: '#8c8c8c' }}>Фінансові дані</Divider>
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item name="iban" label="IBAN">
              <Input placeholder="UA..." />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="bankCard" label="Номер картки">
              <Input />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="bankName" label="Банк">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* Посвідчення водія */}
        <Divider orientation="left" plain style={{ fontSize: 13, color: '#8c8c8c' }}>Посвідчення водія</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="driverLicenseCategory" label="Категорія">
              <Input placeholder="B, C, D..." />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="driverLicenseSeries" label="Серія">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="driverLicenseNumber" label="Номер">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="driverLicenseExperience" label="Стаж (років)">
              <Input type="number" min={0} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="driverLicenseIssuedBy" label="Ким виданий">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="driverLicenseIssuedDate" label="Дата видачі">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="driverLicenseExpiry" label="Дійсне до">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* Посвідчення тракториста */}
        <Divider orientation="left" plain style={{ fontSize: 13, color: '#8c8c8c' }}>Посвідчення тракториста</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="tractorLicenseCategory" label="Категорія">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="tractorLicenseSeries" label="Серія">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="tractorLicenseNumber" label="Номер">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="tractorLicenseExperience" label="Стаж (років)">
              <Input type="number" min={0} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="tractorLicenseIssuedBy" label="Ким виданий">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="tractorLicenseIssuedDate" label="Дата видачі">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="tractorLicenseExpiry" label="Дійсне до">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* Базова загальновійськова підготовка */}
        <Divider orientation="left" plain style={{ fontSize: 13, color: '#8c8c8c' }}>Базова загальновійськова підготовка</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="basicTrainingDateFrom" label="Дата початку">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="basicTrainingDateTo" label="Дата закінчення">
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="basicTrainingCommander" label="Командир">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="basicTrainingPlace" label="Місце проходження">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="basicTrainingNotes" label="Примітки">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  )
}
