import { useState, useEffect } from 'react'
import ProLayout from '@ant-design/pro-layout'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SwapOutlined,
  TagsOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ImportOutlined,
  SettingOutlined,
  SolutionOutlined,
  UnorderedListOutlined,
  UserDeleteOutlined,
  BranchesOutlined,
  TableOutlined,
  FormOutlined,
  FolderOutlined,
  MedicineBoxOutlined,
  FileProtectOutlined,
  DatabaseOutlined
} from '@ant-design/icons'
import { Tag } from 'antd'
import dayjs from 'dayjs'
import AppRoutes from '../../routes'

const menuRoutes = {
  route: {
    path: '/',
    routes: [
      {
        path: '/',
        name: 'Головна',
        icon: <DashboardOutlined />
      },
      {
        path: '/personnel-group',
        name: 'Особовий склад',
        icon: <TeamOutlined />,
        routes: [
          { path: '/personnel', name: 'Реєстр', icon: <UnorderedListOutlined /> },
          { path: '/personnel/excluded', name: 'Виключені', icon: <UserDeleteOutlined /> }
        ]
      },
      {
        path: '/structure-group',
        name: 'Штат та посади',
        icon: <ApartmentOutlined />,
        routes: [
          { path: '/org-structure', name: 'Орг. структура', icon: <BranchesOutlined /> },
          { path: '/staffing', name: 'ШПО', icon: <TableOutlined /> },
          { path: '/positions', name: 'Перелік посад', icon: <SolutionOutlined /> }
        ]
      },
      {
        path: '/movements',
        name: 'Переміщення',
        icon: <SwapOutlined />
      },
      {
        path: '/statuses',
        name: 'Статуси',
        icon: <TagsOutlined />
      },
      {
        path: '/attendance-group',
        name: 'Табель',
        icon: <CalendarOutlined />,
        routes: [
          { path: '/attendance', name: 'Місячний табель', icon: <CalendarOutlined /> },
          { path: '/formation-report', name: 'Стройова записка', icon: <FormOutlined /> }
        ]
      },
      {
        path: '/documents-group',
        name: 'Документи',
        icon: <FileTextOutlined />,
        routes: [
          { path: '/orders', name: 'Накази', icon: <FileProtectOutlined /> },
          { path: '/leave', name: 'Відпустки', icon: <FileTextOutlined /> },
          { path: '/injuries', name: 'Поранення / Втрати', icon: <MedicineBoxOutlined /> },
          { path: '/documents/generate', name: 'Генератор', icon: <FormOutlined /> },
          { path: '/documents/archive', name: 'Архів', icon: <FolderOutlined /> }
        ]
      },
      {
        path: '/statistics',
        name: 'Статистика',
        icon: <BarChartOutlined />
      },
      {
        path: '/import-export',
        name: 'Імпорт / Експорт',
        icon: <ImportOutlined />
      },
      {
        path: '/settings',
        name: 'Налаштування',
        icon: <SettingOutlined />
      }
    ]
  }
}

export default function AppLayout(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [dbStatus, setDbStatus] = useState<string>('')

  useEffect(() => {
    window.api.dbHealth().then((result: { ok: boolean; message: string }) => {
      setDbStatus(result.ok ? 'OK' : 'Error')
    })
  }, [])

  return (
    <ProLayout
      title="ЕЖООС+"
      logo={<DatabaseOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
      layout="mix"
      fixSiderbar
      fixedHeader
      {...menuRoutes}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => (
        <div onClick={() => item.path && navigate(item.path)}>{dom}</div>
      )}
      headerContentRender={() => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tag color="blue">12 ОШР</Tag>
          <Tag color="green">4 ШБ (А0501)</Tag>
          <Tag color="orange">92 ОШБр (А1314)</Tag>
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: 13 }}>
            {dayjs().format('DD.MM.YYYY dddd')}
          </span>
          {dbStatus && (
            <Tag color={dbStatus === 'OK' ? 'success' : 'error'} style={{ marginLeft: 8 }}>
              БД: {dbStatus}
            </Tag>
          )}
        </div>
      )}
      menuFooterRender={(props) => {
        if (props?.collapsed) return undefined
        return (
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: '#999' }}>
            ЕЖООС+ v0.1.0
          </div>
        )
      }}
    >
      <AppRoutes />
    </ProLayout>
  )
}
