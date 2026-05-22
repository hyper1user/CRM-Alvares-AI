import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Typography, Button, Input, Space, Alert, Divider, App, Progress, Tag } from 'antd'
import {
  SettingOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloudDownloadOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  TagsOutlined,
  RightOutlined,
  FileExcelOutlined,
  LinkOutlined
} from '@ant-design/icons'
import UnitAboutCard from '../components/layout/UnitAboutCard'

const { Paragraph, Text } = Typography

type UpdaterStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up-to-date'; currentVersion: string }
  | { state: 'available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export default function Settings(): JSX.Element {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [docsRoot, setDocsRoot] = useState<string>('')
  const [saved, setSaved] = useState(false)
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatus>({ state: 'idle' })
  // v1.7.2: шлях до BR_4ShB.xlsx (зовнішній довідник БР батальйону).
  const [brBatXlsxPath, setBrBatXlsxPath] = useState<string>('')
  const [brBatSaved, setBrBatSaved] = useState(false)

  useEffect(() => {
    window.api.docsGetRoot().then((val) => {
      if (val) setDocsRoot(val)
    })

    // v1.7.2: load BR_4ShB.xlsx path
    window.api.settingsGet('br_bat_xlsx_path').then((val) => {
      if (val) setBrBatXlsxPath(val as string)
    })

    // Get current updater status
    window.api.updaterGetStatus().then((s) => setUpdaterStatus(s as UpdaterStatus))

    // Subscribe to live status updates
    const unsub = window.api.updaterOnStatus((s) => setUpdaterStatus(s as UpdaterStatus))
    return () => {
      unsub()
    }
  }, [])

  const handleBrowse = async () => {
    const path = await window.api.docsBrowseRoot()
    if (path) {
      setDocsRoot(path)
      setSaved(false)
    }
  }

  const handleSave = async () => {
    if (!docsRoot.trim()) return
    await window.api.docsSetRoot(docsRoot.trim())
    setSaved(true)
    message.success('Шлях збережено')
  }

  // v1.7.2: BR_4ShB.xlsx file-picker + save.
  const handleBrowseBrBat = async (): Promise<void> => {
    const path = await window.api.openFileDialog([
      { name: 'Excel-таблиця', extensions: ['xlsx', 'xls'] }
    ])
    if (path) {
      setBrBatXlsxPath(path)
      setBrBatSaved(false)
    }
  }
  const handleSaveBrBat = async (): Promise<void> => {
    if (!brBatXlsxPath.trim()) return
    await window.api.settingsSet('br_bat_xlsx_path', brBatXlsxPath.trim())
    setBrBatSaved(true)
    message.success('Шлях BR_4ShB.xlsx збережено')
  }

  const handleCheckUpdate = () => {
    window.api.updaterCheck()
  }

  const renderUpdaterStatus = () => {
    switch (updaterStatus.state) {
      case 'idle':
        return <Tag icon={<InfoCircleOutlined />} color="default">Не перевірялось</Tag>
      case 'checking':
        return <Tag icon={<SyncOutlined spin />} color="processing">Перевірка оновлень...</Tag>
      case 'up-to-date':
        return <Tag icon={<CheckCircleOutlined />} color="success">Остання версія ({updaterStatus.currentVersion})</Tag>
      case 'available':
        return <Tag icon={<CloudDownloadOutlined />} color="warning">Доступне оновлення {updaterStatus.version}</Tag>
      case 'downloading':
        return (
          <Space>
            <Tag icon={<SyncOutlined spin />} color="processing">Завантаження...</Tag>
            <Progress percent={updaterStatus.percent} size="small" style={{ width: 120 }} />
          </Space>
        )
      case 'downloaded':
        return (
          <Space>
            <Tag icon={<CheckCircleOutlined />} color="success">Готово до встановлення ({updaterStatus.version})</Tag>
            <Button size="small" type="primary" onClick={() => window.api.updaterInstall()}>
              Перезапустити і встановити
            </Button>
          </Space>
        )
      case 'error':
        return (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message="Помилка перевірки оновлень"
            description={<Text code style={{ fontSize: 11 }}>{updaterStatus.message}</Text>}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="titles">
          <div className="eyebrow">система · конфігурація</div>
          <h1>Налаштування</h1>
          <div className="sub">Оновлення, інтеграції, папка документів, тема</div>
        </div>
      </div>
    <Space direction="vertical" size={24} style={{ width: '100%' }}>

      {/* Updater */}
      <Card
        title={
          <Space>
            <CloudDownloadOutlined />
            <span>Оновлення додатку</span>
          </Space>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Button
              icon={<SyncOutlined spin={updaterStatus.state === 'checking'} />}
              onClick={handleCheckUpdate}
              disabled={updaterStatus.state === 'checking' || updaterStatus.state === 'downloading'}
            >
              Перевірити оновлення
            </Button>
            {renderUpdaterStatus()}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Оновлення перевіряються автоматично при запуску додатку (через 5 секунд).
          </Text>
        </Space>
      </Card>

      {/* Lookups */}
      <Card
        title={
          <Space>
            <TagsOutlined />
            <span>Довідники</span>
          </Space>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Кастомізація значень, що використовуються в усіх модулях.
        </Paragraph>
        <Space wrap>
          <Button
            icon={<TagsOutlined />}
            onClick={() => navigate('/settings/statuses')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Статуси особового складу
            <RightOutlined style={{ fontSize: 11 }} />
          </Button>
          <Button
            icon={<TagsOutlined />}
            onClick={() => navigate('/settings/br-roles')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Ролі у Бойовому розпорядженні
            <RightOutlined style={{ fontSize: 11 }} />
          </Button>
          <Button
            icon={<TagsOutlined />}
            onClick={() => navigate('/settings/rop-phrases')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Фрази для бойових завдань (РОП)
            <RightOutlined style={{ fontSize: 11 }} />
          </Button>
        </Space>
      </Card>

      {/* Docs folder */}
      <Card
        title={
          <Space>
            <FolderOpenOutlined />
            <span>Папка документів особового складу</span>
          </Space>
        }
      >
        <Paragraph type="secondary">
          Вкажіть корінну папку, де зберігаються документи військовослужбовців.
          Очікувана структура:
        </Paragraph>
        <pre style={{ fontSize: 12, background: '#f5f5f5', color: '#333', padding: 12, borderRadius: 6 }}>
{`Корінна папка/
  1 штурмовий взвод/
    ПРІЗВИЩЕ Ім'я По батькові/
      файл - паспорт.pdf
      файл - УБД.pdf
      фото.jpg
  2 штурмовий взвод/
    ...`}
        </pre>

        <Divider />

        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={docsRoot}
            onChange={(e) => { setDocsRoot(e.target.value); setSaved(false) }}
            placeholder="J:\Мой диск\12ШР — документи особового складу"
            style={{ flex: 1 }}
          />
          <Button icon={<FolderOpenOutlined />} onClick={handleBrowse}>
            Вибрати
          </Button>
          <Button
            type="primary"
            icon={saved ? <CheckCircleOutlined /> : <SettingOutlined />}
            onClick={handleSave}
            disabled={!docsRoot.trim()}
          >
            {saved ? 'Збережено' : 'Зберегти'}
          </Button>
        </Space.Compact>

        {docsRoot && (
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message={<Text>Поточний шлях: <Text code>{docsRoot}</Text></Text>}
          />
        )}
      </Card>

      {/* v1.7.2: Інтеграції — зовнішні файли/системи */}
      <Card
        title={
          <Space>
            <LinkOutlined />
            <span>Інтеграції</span>
          </Space>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Шляхи до зовнішніх файлів, на які покладається додаток.
        </Paragraph>

        <Card
          type="inner"
          size="small"
          title={
            <Space>
              <FileExcelOutlined style={{ color: '#1a7f37' }} />
              <span>BR_4ShB.xlsx — довідник БР батальйону</span>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
            Excel-таблиця з номерами БР командира 4 ШБ за датами. Використовується при генерації Бойового розпорядження роти ({'{{бр}}'} та {'{{дата_бр}}'} плейсхолдери). До 4 БР на день у колонках A-B, D-E, G-H, J-K.
            <br />
            Якщо шлях не задано — використовується legacy default <Text code>D:\Project_CRM\BR_4ShB.xlsx</Text>.
          </Paragraph>

          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={brBatXlsxPath}
              onChange={(e) => { setBrBatXlsxPath(e.target.value); setBrBatSaved(false) }}
              placeholder="D:\Project_CRM\BR_4ShB.xlsx"
              style={{ flex: 1 }}
            />
            <Button icon={<FolderOpenOutlined />} onClick={handleBrowseBrBat}>
              Вибрати
            </Button>
            <Button
              type="primary"
              icon={brBatSaved ? <CheckCircleOutlined /> : <SettingOutlined />}
              onClick={handleSaveBrBat}
              disabled={!brBatXlsxPath.trim()}
            >
              {brBatSaved ? 'Збережено' : 'Зберегти'}
            </Button>
          </Space.Compact>

          {brBatXlsxPath && (
            <Alert
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              message={<Text>Поточний шлях: <Text code>{brBatXlsxPath}</Text></Text>}
            />
          )}
        </Card>
      </Card>

      {/* About */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>Про додаток</span>
          </Space>
        }
      >
        <Paragraph>
          <b>АльваресAI</b> – система обліку особового складу 12 штурмової роти 4 штурмового батальйону 92 окремої штурмової бригади.
        </Paragraph>
      </Card>

      <UnitAboutCard />
    </Space>
    </>
  )
}
