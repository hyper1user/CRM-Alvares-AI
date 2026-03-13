import { useEffect } from 'react'
import { Drawer, Form, Select, DatePicker, Input, Button, Space, Tag, App } from 'antd'
import dayjs from 'dayjs'
import PersonnelSearchSelect from '../movements/PersonnelSearchSelect'
import { useLookups } from '../../hooks/useLookups'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  personnelId?: number
}

export default function StatusHistoryForm({
  open,
  onClose,
  onSaved,
  personnelId
}: Props): JSX.Element {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { statusTypes } = useLookups()

  // Group statuses by groupName for optgroup display
  const groupedStatuses = statusTypes.reduce(
    (acc, st) => {
      const group = st.groupName || 'Інше'
      if (!acc[group]) acc[group] = []
      acc[group].push(st)
      return acc
    },
    {} as Record<string, typeof statusTypes>
  )

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (personnelId) {
        form.setFieldsValue({ personnelId })
      }
    }
  }, [open, personnelId, form])

  const handleSubmit = async (): Promise<void> => {
    console.log('[StatusHistoryForm] handleSubmit called')

    let values
    try {
      values = await form.validateFields()
      console.log('[StatusHistoryForm] validateFields OK:', values)
    } catch (validationErr) {
      console.warn('[StatusHistoryForm] validateFields FAILED:', validationErr)
      return
    }

    try {
      const data: Record<string, unknown> = {
        personnelId: values.personnelId,
        statusCode: values.statusCode,
        dateFrom: values.dateFrom.format('YYYY-MM-DD'),
        dateTo: values.dateTo?.format('YYYY-MM-DD') ?? '',
        presenceGroup: values.presenceGroup ?? '',
        comment: values.comment ?? ''
      }

      console.log('[StatusHistoryForm] IPC data:', data)
      const result = await window.api.statusHistoryCreate(data)
      console.log('[StatusHistoryForm] IPC result:', result)

      if (result?.error) {
        const issues = result.issues?.map((i: { message: string }) => i.message).join(', ')
        message.error(`Помилка валідації: ${issues || 'невідома'}`)
        return
      }

      message.success('Статус додано')
      onSaved()
      onClose()
    } catch (err) {
      console.error('[StatusHistoryForm] create error:', err)
      message.error(`Помилка збереження: ${String(err)}`)
    }
  }

  return (
    <Drawer
      title="Новий статус"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Скасувати</Button>
          <Button type="primary" onClick={handleSubmit}>
            Зберегти
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="personnelId"
          label="Військовослужбовець"
          rules={[{ required: true, message: 'Оберіть особу' }]}
        >
          <PersonnelSearchSelect disabled={!!personnelId} />
        </Form.Item>

        <Form.Item
          name="statusCode"
          label="Статус"
          rules={[{ required: true, message: 'Оберіть статус' }]}
        >
          <Select
            showSearch
            placeholder="Оберіть статус"
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
          >
            {Object.entries(groupedStatuses).map(([group, items]) => (
              <Select.OptGroup key={group} label={group}>
                {items.map((st) => (
                  <Select.Option key={st.code} value={st.code} label={`${st.name} (${st.code})`}>
                    <Tag color={st.colorCode || 'default'} style={{ marginRight: 8 }}>
                      {st.code}
                    </Tag>
                    {st.name}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            ))}
          </Select>
        </Form.Item>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item
            name="dateFrom"
            label="Дата з"
            rules={[{ required: true, message: "Обов'язкове поле" }]}
            style={{ flex: 1 }}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dateTo" label="Дата по" style={{ flex: 1 }}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Space>

        <Form.Item name="presenceGroup" label="Група присутності">
          <Select
            allowClear
            placeholder="Оберіть групу"
            options={[
              { value: 'Н', label: 'Н — Наявний' },
              { value: 'В', label: 'В — Відсутній' },
              { value: 'ВП', label: 'ВП — Відпустка' },
              { value: 'ВД', label: 'ВД — Відрядження' },
              { value: 'Л', label: 'Л — Лікування' },
              { value: 'НВ', label: 'НВ — Навчання' }
            ]}
          />
        </Form.Item>

        <Form.Item name="comment" label="Коментар">
          <Input.TextArea rows={3} placeholder="Додаткова інформація" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
