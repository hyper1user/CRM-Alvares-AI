import { useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Switch,
  message,
  Row,
  Col
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useLookups } from '../../hooks/useLookups'
import type { Position } from '@shared/types/position'

interface PositionFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editRecord?: Position | null
}

export default function PositionForm({ open, onClose, onSaved, editRecord }: PositionFormProps) {
  const [form] = Form.useForm()
  const { subdivisions, loading } = useLookups()
  const isEdit = !!editRecord

  useEffect(() => {
    if (!open) return

    if (editRecord) {
      form.setFieldsValue({
        ...editRecord,
        isActive: editRecord.isActive ?? true
      })
    } else {
      form.resetFields()
      form.setFieldValue('isActive', true)
    }
  }, [open, editRecord, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const data: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(values)) {
        data[key] = value ?? null
      }

      let result: Record<string, unknown>
      if (isEdit && editRecord) {
        result = await window.api.positionsUpdate(editRecord.id, data)
      } else {
        result = await window.api.positionsCreate(data)
      }

      if (result && 'error' in result && result.error) {
        const issues = (result as { issues: { message: string }[] }).issues
        message.error(issues?.map((i) => i.message).join(', ') || 'Помилка валідації')
        return
      }

      message.success(isEdit ? 'Посаду оновлено' : 'Посаду додано')
      onSaved()
      onClose()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('Помилка збереження: ' + String(err))
    }
  }

  const subdivisionOptions = subdivisions.map((s) => ({
    label: `${s.code} — ${s.name}`,
    value: s.id
  }))

  return (
    <Drawer
      title={isEdit ? 'Редагування посади' : 'Додавання посади'}
      open={open}
      onClose={onClose}
      width={560}
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="positionIndex"
              label="Індекс посади"
              rules={[{ required: true, message: "Індекс обов'язковий" }]}
            >
              <Input placeholder="Г03001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="subdivisionId"
              label="Підрозділ"
              rules={[{ required: true, message: "Підрозділ обов'язковий" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={subdivisionOptions}
                placeholder="Оберіть підрозділ"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="title"
          label="Назва посади"
          rules={[{ required: true, message: "Назва обов'язкова" }]}
        >
          <Input placeholder="Командир взводу" />
        </Form.Item>
        <Form.Item name="detail" label="Деталі (уточнення)">
          <Input placeholder="1-й штурмовий взвод" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="rankRequired" label="Необхідне звання">
              <Input placeholder="лейтенант" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="specialtyCode" label="ВОС (код спеціальності)">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="tariffGrade" label="Тарифний розряд">
              <InputNumber style={{ width: '100%' }} min={1} max={25} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="staffNumber" label="Штатний номер">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="isActive" label="Активна" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label="Примітки">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
