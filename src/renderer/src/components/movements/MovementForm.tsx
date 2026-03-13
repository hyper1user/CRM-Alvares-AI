import { useEffect } from 'react'
import { Drawer, Form, Input, Select, DatePicker, Button, Space, App } from 'antd'
import dayjs from 'dayjs'
import PersonnelSearchSelect from './PersonnelSearchSelect'
import { useLookups } from '../../hooks/useLookups'
import { MOVEMENT_ORDER_TYPES, ORDER_ISSUERS } from '@shared/enums/categories'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  personnelId?: number
  currentPositionIdx?: string | null
}

export default function MovementForm({
  open,
  onClose,
  onSaved,
  personnelId,
  currentPositionIdx
}: Props): JSX.Element {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { positions } = useLookups()

  // Active positions for selection
  const activePositions = positions.filter((p) => p.isActive)

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (personnelId) {
        form.setFieldsValue({ personnelId })
      }
      if (currentPositionIdx) {
        form.setFieldsValue({ previousPosition: currentPositionIdx })
      }
    }
  }, [open, personnelId, currentPositionIdx, form])

  const handleSubmit = async (): Promise<void> => {
    console.log('[MovementForm] handleSubmit called')

    let values
    try {
      values = await form.validateFields()
      console.log('[MovementForm] validateFields OK:', values)
    } catch (validationErr) {
      console.warn('[MovementForm] validateFields FAILED:', validationErr)
      return
    }

    try {
      const data: Record<string, unknown> = {
        personnelId: values.personnelId,
        orderType: values.orderType,
        orderIssuer: values.orderIssuer ?? '',
        orderNumber: values.orderNumber ?? '',
        orderDate: values.orderDate?.format('YYYY-MM-DD') ?? '',
        dailyOrderNumber: values.dailyOrderNumber ?? '',
        positionIndex: values.positionIndex ?? '',
        dateFrom: values.dateFrom.format('YYYY-MM-DD'),
        dateTo: values.dateTo?.format('YYYY-MM-DD') ?? '',
        previousPosition: values.previousPosition ?? '',
        notes: values.notes ?? ''
      }

      console.log('[MovementForm] IPC data:', data)
      const result = await window.api.movementsCreate(data)
      console.log('[MovementForm] IPC result:', result)

      if (result?.error) {
        const issues = result.issues?.map((i: { message: string }) => i.message).join(', ')
        message.error(`Помилка валідації: ${issues || 'невідома'}`)
        return
      }

      message.success('Переміщення створено')
      onSaved()
      onClose()
    } catch (err) {
      console.error('[MovementForm] create error:', err)
      message.error(`Помилка збереження: ${String(err)}`)
    }
  }

  return (
    <Drawer
      title="Нове переміщення"
      width={640}
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
          name="orderType"
          label="Тип переміщення"
          rules={[{ required: true, message: 'Оберіть тип' }]}
        >
          <Select
            placeholder="Оберіть тип"
            options={MOVEMENT_ORDER_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </Form.Item>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item name="orderIssuer" label="Хто видав наказ" style={{ flex: 1 }}>
            <Select
              placeholder="Оберіть"
              allowClear
              options={ORDER_ISSUERS.map((o) => ({ value: o, label: o }))}
            />
          </Form.Item>
          <Form.Item name="orderNumber" label="Номер наказу" style={{ flex: 1 }}>
            <Input placeholder="№ наказу" />
          </Form.Item>
        </Space>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item name="orderDate" label="Дата наказу" style={{ flex: 1 }}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dailyOrderNumber" label="№ добового наказу" style={{ flex: 1 }}>
            <Input placeholder="№" />
          </Form.Item>
        </Space>

        <Form.Item name="positionIndex" label="Посада (на яку переміщується)">
          <Select
            showSearch
            allowClear
            placeholder="Оберіть посаду"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={activePositions.map((p) => ({
              value: p.positionIndex,
              label: `${p.positionIndex} — ${p.title}`
            }))}
          />
        </Form.Item>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item
            name="dateFrom"
            label="Дата з"
            rules={[{ required: true, message: 'Обов\'язкове поле' }]}
            style={{ flex: 1 }}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dateTo" label="Дата по" style={{ flex: 1 }}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Space>

        <Form.Item name="previousPosition" label="Попередня посада">
          <Input disabled placeholder="Заповнюється автоматично" />
        </Form.Item>

        <Form.Item name="notes" label="Примітки">
          <Input.TextArea rows={3} placeholder="Додаткова інформація" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
