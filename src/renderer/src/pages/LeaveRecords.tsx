import { useState } from 'react'
import {
  Typography,
  Button,
  Space,
  Tag,
  Popconfirm,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message
} from 'antd'
import {
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useLeaveList } from '@renderer/hooks/useLeaveRecords'
import PersonnelSearchSelect from '@renderer/components/movements/PersonnelSearchSelect'
import type { LeaveRecordListItem } from '@shared/types/document'
import dayjs from 'dayjs'

const { Title } = Typography

const LEAVE_TYPES: Record<string, { label: string; color: string }> = {
  'щорічна': { label: 'Щорічна', color: 'green' },
  'основна': { label: 'Основна', color: 'blue' },
  'додаткова': { label: 'Додаткова', color: 'cyan' },
  'за сімейними': { label: 'За сімейними обставинами', color: 'orange' },
  'навчальна': { label: 'Навчальна', color: 'purple' },
  'по хворобі': { label: 'По хворобі', color: 'red' },
  'реабілітаційна': { label: 'Реабілітаційна', color: 'magenta' },
  'соціальна': { label: 'Соціальна', color: 'gold' }
}

const LEAVE_TYPE_OPTIONS = Object.entries(LEAVE_TYPES).map(([value, { label }]) => ({
  value,
  label
}))

export default function LeaveRecords(): JSX.Element {
  const [search, setSearch] = useState('')
  const [leaveType, setLeaveType] = useState<string | undefined>()
  const { records, loading, refetch } = useLeaveList({ search, leaveType })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const result = await window.api.leaveCreate({
        personnelId: values.personnelId,
        leaveType: values.leaveType,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        travelDays: values.travelDays ?? 2,
        destination: values.destination || '',
        orderNumber: values.orderNumber || '',
        orderDate: values.orderDate ? values.orderDate.format('YYYY-MM-DD') : '',
        ticketNumber: values.ticketNumber || '',
        notes: values.notes || ''
      })

      if (result?.success) {
        message.success('Відпустку створено')
        setDrawerOpen(false)
        form.resetFields()
        refetch()
      } else {
        message.error(result?.error ?? 'Помилка створення')
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    const result = await window.api.leaveDelete(id)
    if (result?.success) {
      message.success('Запис видалено')
      refetch()
    } else {
      message.error('Помилка видалення')
    }
  }

  const handleGenerateTicket = async (id: number): Promise<void> => {
    try {
      const result = await window.api.leaveGenerateTicket(id)
      if (result?.success) {
        message.success('Відпускний квиток згенеровано!')
        if (result.document?.filePath) {
          await window.api.documentsOpen(result.document.filePath)
        }
      } else {
        message.error(result?.error ?? 'Помилка генерації квитка')
      }
    } catch (err) {
      message.error(String(err))
    }
  }

  const columns: ProColumns<LeaveRecordListItem>[] = [
    {
      title: 'ПІБ',
      dataIndex: 'fullName',
      ellipsis: true,
      render: (_, record) => (
        <span>
          {record.rankName ? `${record.rankName} ` : ''}
          {record.fullName}
        </span>
      )
    },
    {
      title: 'Тип',
      dataIndex: 'leaveType',
      width: 160,
      render: (_, record) => {
        const info = LEAVE_TYPES[record.leaveType]
        return info ? (
          <Tag color={info.color}>{info.label}</Tag>
        ) : (
          <Tag>{record.leaveType}</Tag>
        )
      }
    },
    {
      title: 'Початок',
      dataIndex: 'startDate',
      width: 110,
      render: (_, record) => dayjs(record.startDate).format('DD.MM.YYYY')
    },
    {
      title: 'Кінець',
      dataIndex: 'endDate',
      width: 110,
      render: (_, record) => dayjs(record.endDate).format('DD.MM.YYYY')
    },
    {
      title: 'Днів дороги',
      dataIndex: 'travelDays',
      width: 100,
      align: 'center'
    },
    {
      title: 'Пункт',
      dataIndex: 'destination',
      ellipsis: true,
      width: 160,
      render: (_, record) => record.destination || '—'
    },
    {
      title: 'Наказ',
      dataIndex: 'orderNumber',
      width: 120,
      render: (_, record) =>
        record.orderNumber
          ? `№${record.orderNumber} ${record.orderDate ? dayjs(record.orderDate).format('DD.MM.YY') : ''}`
          : '—'
    },
    {
      title: 'Дії',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleGenerateTicket(record.id)}
          >
            Квиток
          </Button>
          <Popconfirm
            title="Видалити запис?"
            onConfirm={() => handleDelete(record.id)}
            okText="Так"
            cancelText="Ні"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <CalendarOutlined /> Відпустки
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          Нова відпустка
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Пошук за ПІБ, пунктом..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          placeholder="Тип відпустки"
          value={leaveType}
          onChange={setLeaveType}
          allowClear
          style={{ width: 200 }}
          options={LEAVE_TYPE_OPTIONS}
        />
      </Space>

      <ProTable<LeaveRecordListItem>
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        search={false}
        toolBarRender={false}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      {/* Create Drawer */}
      <Drawer
        title="Нова відпустка"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Скасувати</Button>
            <Button type="primary" loading={submitting} onClick={handleCreate}>
              Створити
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ travelDays: 2 }}>
          <Form.Item
            name="personnelId"
            label="Особа"
            rules={[{ required: true, message: 'Оберіть особу' }]}
          >
            <PersonnelSearchSelect placeholder="Пошук за ПІБ або ІПН..." />
          </Form.Item>

          <Form.Item
            name="leaveType"
            label="Тип відпустки"
            rules={[{ required: true, message: 'Оберіть тип' }]}
          >
            <Select placeholder="Оберіть тип відпустки" options={LEAVE_TYPE_OPTIONS} />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item
              name="startDate"
              label="Дата початку"
              rules={[{ required: true, message: 'Оберіть дату' }]}
            >
              <DatePicker format="DD.MM.YYYY" placeholder="Початок" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="Дата закінчення"
              rules={[{ required: true, message: 'Оберіть дату' }]}
            >
              <DatePicker format="DD.MM.YYYY" placeholder="Кінець" />
            </Form.Item>
            <Form.Item name="travelDays" label="Днів дороги">
              <InputNumber min={0} max={30} style={{ width: 100 }} />
            </Form.Item>
          </Space>

          <Form.Item name="destination" label="Пункт призначення">
            <Input placeholder="Місто, область" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="orderNumber" label="Номер наказу" style={{ flex: 1 }}>
              <Input placeholder="№" />
            </Form.Item>
            <Form.Item name="orderDate" label="Дата наказу">
              <DatePicker format="DD.MM.YYYY" placeholder="Дата" />
            </Form.Item>
          </Space>

          <Form.Item name="ticketNumber" label="Номер квитка">
            <Input placeholder="№ відпускного квитка" />
          </Form.Item>

          <Form.Item name="notes" label="Примітки">
            <Input.TextArea rows={3} placeholder="Примітки" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
