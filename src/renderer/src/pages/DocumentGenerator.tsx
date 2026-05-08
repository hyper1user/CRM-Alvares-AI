import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Steps,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Form,
  Input,
  Result,
  Spin,
  message,
  Tabs,
  DatePicker,
  Empty
} from 'antd'
import {
  FileTextOutlined,
  FileProtectOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/uk'
import locale from 'antd/es/date-picker/locale/uk_UA'
import { useTemplateList } from '@renderer/hooks/useDocuments'
import PersonnelSearchSelect from '@renderer/components/movements/PersonnelSearchSelect'
import TemplateFieldsForm from '@renderer/components/documents/TemplateFieldsForm'
import type {
  DocumentTemplate,
  GeneratedDocument,
  TemplateCategory
} from '@shared/types/document'

const { Title, Text } = Typography

dayjs.locale('uk')

// v1.4.0: 4 видимі категорії в порядку, в якому юзер їх назвав:
// Події → Рапорти → Звільнення → Грошове забезпечення.
// 'retired' відфільтровується нижче — UI його не показує взагалі.
const CATEGORIES: Array<{
  value: TemplateCategory
  label: string
  icon: React.ReactNode
}> = [
  { value: 'event', label: 'Події', icon: <AlertOutlined /> },
  { value: 'raport', label: 'Рапорти', icon: <FileDoneOutlined /> },
  { value: 'discharge', label: 'Звільнення', icon: <LogoutOutlined /> },
  { value: 'monetary', label: 'Грошове забезпечення', icon: <DollarOutlined /> }
]

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  order: <FileTextOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
  leave_ticket: <FileProtectOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
  injury_certificate: <MedicineBoxOutlined style={{ fontSize: 32, color: '#fa541c' }} />,
  report: <AlertOutlined style={{ fontSize: 32, color: '#faad14' }} />,
  certificate: <SafetyCertificateOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
  // v1.4.0/v1.5.0/v1.6.0: special pipelines.
  xlsx_dgv: <DollarOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
  docx_confirmation: <FileDoneOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
  docx_disposition: <AlertOutlined style={{ fontSize: 32, color: '#fa541c' }} />
}

// v1.5.0: типи шаблонів, що використовують month-picker UI замість
// TemplateFieldsForm. Обидва приймають fields={year,month}.
const MONTH_PICKER_TYPES = ['xlsx_dgv', 'docx_confirmation'] as const

export default function DocumentGenerator(): JSX.Element {
  const { templates, loading: templatesLoading } = useTemplateList()
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('event')
  const [current, setCurrent] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [personnelId, setPersonnelId] = useState<number | undefined>()
  // v1.4.0: для xlsx_dgv — окремий state для періоду (рік+місяць).
  // Default — поточний місяць; юзер може змінити перед генерацією.
  const [period, setPeriod] = useState<Dayjs>(() => dayjs())
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedDocument | null>(null)
  const [form] = Form.useForm()

  const isXlsxDgv = selectedTemplate?.templateType === 'xlsx_dgv'
  const isDocxConfirmation = selectedTemplate?.templateType === 'docx_confirmation'
  // v1.5.0: спільна гілка UI для обох month-picker-шаблонів.
  const isMonthPicker = !!selectedTemplate && (MONTH_PICKER_TYPES as readonly string[]).includes(selectedTemplate.templateType)
  // v1.6.0: окрема гілка для disposition (день виконання + 2 текстові поля).
  const isDocxDisposition = selectedTemplate?.templateType === 'docx_disposition'
  const isSpecialPipeline = isMonthPicker || isDocxDisposition

  // Templates per active category, excluding 'retired' globally.
  const visibleTemplates = useMemo(
    () => templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory]
  )

  // Load tags when DOCX template selected. Skip for special-pipeline
  // шаблонів (xlsx_dgv/docx_confirmation/docx_disposition — мають свої
  // UI-форми замість стандартного TemplateFieldsForm).
  useEffect(() => {
    if (!selectedTemplate || isSpecialPipeline) {
      setTags([])
      return
    }
    setTagsLoading(true)
    window.api
      .templatesGetTags(selectedTemplate.id)
      .then((t) => setTags(t ?? []))
      .catch(() => setTags([]))
      .finally(() => setTagsLoading(false))
  }, [selectedTemplate, isSpecialPipeline])

  const handleSelectTemplate = (tmpl: DocumentTemplate): void => {
    setSelectedTemplate(tmpl)
    setPersonnelId(undefined)
    setResult(null)
    setPeriod(dayjs())
    form.resetFields()
    setCurrent(1)
  }

  const handleGenerate = async (): Promise<void> => {
    if (!selectedTemplate) return
    setGenerating(true)
    try {
      // v1.6.0: гілка для disposition (день + номер БР батальйону).
      if (isDocxDisposition) {
        const values = await form.validateFields()
        const fields = {
          executionDate: period.format('YYYY-MM-DD'),
          brBatNumber: String(values.brBatNumber ?? ''),
          brBatDate: String(values.brBatDate ?? '')
        }
        const data = {
          templateId: selectedTemplate.id,
          title: values.title || `Бойове розпорядження ${period.format('DD.MM.YYYY')}`,
          fields
        }
        const response = await window.api.documentsGenerateDisposition(data)
        if (response?.canceled) {
          message.info('Генерацію скасовано')
          return
        }
        if (response?.error) {
          message.error(response.message ?? 'Помилка генерації')
          return
        }
        setResult(response)
        setCurrent(3)
        message.success('Бойове розпорядження згенеровано!')
        return
      }

      // v1.4.0/v1.5.0: розгалуження за templateType. Для month-picker
      // шаблонів — окремий IPC-канал з save-dialog'ом і year/month у
      // fields. Спільний контракт response (canceled/error/result).
      if (isMonthPicker) {
        const fields = {
          year: String(period.year()),
          month: String(period.month() + 1)
        }
        const titleFallback = isXlsxDgv
          ? `ДГВ-рапорт ${period.format('MMMM YYYY')}`
          : `Підтвердження ${period.format('MMMM YYYY')}`
        const data = {
          templateId: selectedTemplate.id,
          title: form.getFieldValue('title') || titleFallback,
          fields
        }
        const response = isXlsxDgv
          ? await window.api.documentsGenerateXlsxDgv(data)
          : await window.api.documentsGenerateConfirmation(data)
        if (response?.canceled) {
          message.info('Генерацію скасовано')
          return
        }
        if (response?.error) {
          message.error(response.message ?? 'Помилка генерації')
          return
        }
        setResult(response)
        setCurrent(3)
        message.success(isXlsxDgv ? 'ДГВ-рапорт згенеровано!' : 'Підтвердження згенеровано!')
        return
      }

      // Standard docx pipeline
      const values = await form.validateFields()
      const response = await window.api.documentsGenerate({
        templateId: selectedTemplate.id,
        title: values.title || selectedTemplate.name,
        personnelIds: personnelId ? [personnelId] : undefined,
        fields: values.fields ?? {}
      })

      if (response?.error) {
        message.error(response.message ?? 'Помилка генерації')
        return
      }

      setResult(response)
      setCurrent(3)
      message.success('Документ згенеровано!')
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return // validation
      message.error(String(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleOpenFile = async (): Promise<void> => {
    if (result?.filePath) {
      await window.api.documentsOpen(result.filePath)
    }
  }

  const handleReset = (): void => {
    setCurrent(0)
    setSelectedTemplate(null)
    setTags([])
    setPersonnelId(undefined)
    setPeriod(dayjs())
    setResult(null)
    form.resetFields()
  }

  const handleCategoryChange = (key: string): void => {
    setActiveCategory(key as TemplateCategory)
    // Reset wizard if user switches tab mid-flow
    if (current > 0) handleReset()
  }

  const steps = [
    { title: 'Шаблон' },
    { title: isSpecialPipeline ? (isDocxDisposition ? 'День і БР' : 'Період') : 'Дані' },
    { title: 'Перевірка' },
    { title: 'Готово' }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="titles">
          <div className="eyebrow">генератор · word + xlsx</div>
          <h1>Генерація документів</h1>
          <div className="sub">
            Шаблони згруповані за категоріями. Для звичайних рапортів — підстановка через
            docxtemplater; для ДГВ-рапорту — генерація .xlsx з табельних даних місяця.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 12 }}>
        <Steps current={current} items={steps} />
      </div>

      {/* Step 0: Select Category + Template */}
      {current === 0 && (
        <Card bodyStyle={{ paddingTop: 0 }}>
          <Tabs
            activeKey={activeCategory}
            onChange={handleCategoryChange}
            items={CATEGORIES.map((c) => ({
              key: c.value,
              label: (
                <span>
                  {c.icon} {c.label}
                </span>
              )
            }))}
          />
          <Spin spinning={templatesLoading}>
            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              {visibleTemplates.map((tmpl) => (
                <Col key={tmpl.id} xs={24} sm={12} lg={8}>
                  <Card
                    hoverable
                    onClick={() => handleSelectTemplate(tmpl)}
                    style={{ textAlign: 'center', minHeight: 160 }}
                  >
                    {TEMPLATE_ICONS[tmpl.templateType] ?? (
                      <FileTextOutlined style={{ fontSize: 32 }} />
                    )}
                    <Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>
                      {tmpl.name}
                    </Title>
                    <Text type="secondary">{tmpl.description}</Text>
                  </Card>
                </Col>
              ))}
              {!templatesLoading && visibleTemplates.length === 0 && (
                <Col span={24}>
                  <Empty description={`У категорії «${CATEGORIES.find((c) => c.value === activeCategory)?.label}» поки немає шаблонів`} />
                </Col>
              )}
            </Row>
          </Spin>
        </Card>
      )}

      {/* Step 1: Fill Data / Pick Period / Pick Day-and-BR */}
      {current === 1 && selectedTemplate && (
        <Card title={`${isSpecialPipeline ? (isDocxDisposition ? 'Параметри' : 'Період для') : 'Заповнення:'} ${selectedTemplate.name}`}>
          {isDocxDisposition ? (
            // v1.6.0: спецUI для Розпорядження. День виконання + 2
            // текстові поля (БР батальйону). Auto-assign ролей за посадою,
            // КСП/н.п. lookup за датою — все на бекенді.
            <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
              <Form.Item
                name="title"
                label="Назва документа"
                initialValue={`Бойове розпорядження ${period.format('DD.MM.YYYY')}`}
              >
                <Input placeholder="Назва для архіву" />
              </Form.Item>

              <Form.Item label="День виконання БР">
                <DatePicker
                  value={period}
                  onChange={(v) => v && setPeriod(v)}
                  locale={locale}
                  format="DD.MM.YYYY"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                  allowClear={false}
                />
              </Form.Item>

              <Form.Item
                name="brBatNumber"
                label="Номер БР командира 4 ШБ"
                rules={[{ required: true, message: 'Введіть номер' }]}
              >
                <Input placeholder="78" />
              </Form.Item>

              <Form.Item
                name="brBatDate"
                label="Дата БР командира 4 ШБ"
                rules={[{ required: true, message: 'Формат DD.MM.YYYY' }]}
              >
                <Input placeholder="04.05.2026" />
              </Form.Item>

              <div
                style={{
                  padding: 12,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line-1)',
                  borderRadius: 4,
                  fontSize: 12,
                  color: 'var(--fg-3)'
                }}
              >
                Номер БР роти й дата (<code>{period.subtract(1, 'day').format('DD.MM.YYYY')}</code>) генеруються автоматично за формулою <code>№doy від (D-1)</code>.
                ОС у 15 ролях розкладається auto-assign'ом за посадою (заступник→ZKR, медик→MEDIC тощо).
                КСП роти й населений пункт — lookup за датою з довідника локацій. ROP-блок MVP <b>прихований</b>; вставиш вручну в Word після генерації (v1.6.1 додасть селектор ROP1..ROP4).
              </div>
            </Form>
          ) : isMonthPicker ? (
            // v1.4.0/v1.5.0: спільний UI для xlsx_dgv та docx_confirmation —
            // тільки місяць. Дані ОС, періоди — автоматично з attendance +
            // status_types.dgv_code. Інформативний блок різниться за типом.
            <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
              <Form.Item
                name="title"
                label="Назва документа"
                initialValue={
                  isXlsxDgv
                    ? `ДГВ-рапорт ${period.format('MMMM YYYY')}`
                    : `Підтвердження ${period.format('MMMM YYYY')}`
                }
              >
                <Input placeholder="Назва для архіву" />
              </Form.Item>

              <Form.Item label="Місяць">
                <DatePicker
                  picker="month"
                  value={period}
                  onChange={(v) => v && setPeriod(v)}
                  locale={locale}
                  format="MMMM YYYY"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                  allowClear={false}
                />
              </Form.Item>

              <div
                style={{
                  padding: 12,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line-1)',
                  borderRadius: 4,
                  fontSize: 12,
                  color: 'var(--fg-3)'
                }}
              >
                {isXlsxDgv ? (
                  <>
                    Дані беруться автоматично з табелю присутності і ДГВ-маппингу
                    статусів. Підстави виплат — з налаштувань місяця. 4 секції:
                    100К, 30К, не виплачувати, не брав участі.
                  </>
                ) : (
                  <>
                    Word-документ з 2 секціями: п.1 (100К/РОП) і п.2 (30К). Бойові
                    розпорядження для рядових генеруються автоматично за формулою
                    <code style={{ marginLeft: 4 }}>№doy_of_year від (D-1)</code>.
                    Командир роти отримує порожнє поле «Підстава» — вставляєш
                    БР/БН командира батальйону вручну в Word після генерації.
                  </>
                )}
              </div>
            </Form>
          ) : (
            <Spin spinning={tagsLoading}>
              <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
                <Form.Item
                  name="title"
                  label="Назва документа"
                  initialValue={selectedTemplate.name}
                >
                  <Input placeholder="Назва для архіву" />
                </Form.Item>

                <Form.Item label="Особа (для автозаповнення)">
                  <PersonnelSearchSelect
                    value={personnelId}
                    onChange={(v) => setPersonnelId(v)}
                    placeholder="Пошук за ПІБ або ІПН (необов'язково)..."
                  />
                </Form.Item>

                <TemplateFieldsForm tags={tags} hasPersonnel={!!personnelId} />
              </Form>
            </Spin>
          )}

          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrent(0)}>Назад</Button>
            <Button type="primary" onClick={() => setCurrent(2)}>
              Далі
            </Button>
          </Space>
        </Card>
      )}

      {/* Step 2: Review */}
      {current === 2 && selectedTemplate && (
        <Card title="Перевірка перед генерацією">
          <div style={{ marginBottom: 16 }}>
            <Text strong>Шаблон:</Text> {selectedTemplate.name}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Назва:</Text>{' '}
            {form.getFieldValue('title') ||
              (isDocxDisposition
                ? `Бойове розпорядження ${period.format('DD.MM.YYYY')}`
                : isMonthPicker
                  ? `${isXlsxDgv ? 'ДГВ-рапорт' : 'Підтвердження'} ${period.format('MMMM YYYY')}`
                  : selectedTemplate.name)}
          </div>

          {isDocxDisposition ? (
            <div style={{ marginBottom: 16 }}>
              <Text strong>День виконання:</Text> {period.format('DD.MM.YYYY')}
              <br />
              <Text strong>БР батальйону:</Text> №{form.getFieldValue('brBatNumber')} від {form.getFieldValue('brBatDate')}
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-3)' }}>
                Натиснувши «Згенерувати», з'явиться діалог збереження. ROP-блок прихований у MVP — додай вручну в Word'і.
              </div>
            </div>
          ) : isMonthPicker ? (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Період:</Text> {period.format('MMMM YYYY')}
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-3)' }}>
                Натиснувши «Згенерувати», з'явиться діалог збереження.
                {isDocxConfirmation
                  ? ' Після цього відкрий .docx у Word і вставити «Підставу» для командира роти (БР/БН від батальйону).'
                  : ' Файл зберігається у вибрану папку, копія — в архіві Документів.'}
              </div>
            </div>
          ) : (
            <>
              {personnelId && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Особа:</Text> ID {personnelId}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <Text strong>Заповнені поля:</Text>
                <ul style={{ marginTop: 8 }}>
                  {Object.entries(form.getFieldValue('fields') ?? {})
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <li key={k}>
                        <Text code>{k}</Text>: {String(v)}
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}

          <Space>
            <Button onClick={() => setCurrent(1)}>Назад</Button>
            <Button type="primary" loading={generating} onClick={handleGenerate}>
              Згенерувати
            </Button>
          </Space>
        </Card>
      )}

      {/* Step 3: Result */}
      {current === 3 && result && (
        <Result
          status="success"
          icon={<CheckCircleOutlined />}
          title="Документ успішно згенеровано!"
          subTitle={result.title ?? result.documentType}
          extra={[
            <Button
              key="open"
              type="primary"
              icon={<FolderOpenOutlined />}
              onClick={handleOpenFile}
            >
              Відкрити файл
            </Button>,
            <Button key="new" onClick={handleReset}>
              Створити новий
            </Button>
          ]}
        />
      )}
    </div>
  )
}
