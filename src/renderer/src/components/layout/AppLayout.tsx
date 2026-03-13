import { useState, useEffect } from 'react'
import { Layout, Menu, Tag, Space, theme } from 'antd'
import type { MenuProps } from 'antd'
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
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import AppRoutes from '../../routes'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Головна'
  },
  {
    key: 'personnel-group',
    icon: <TeamOutlined />,
    label: 'Особовий склад',
    children: [
      { key: '/personnel', icon: <UnorderedListOutlined />, label: 'Реєстр' },
      { key: '/personnel/excluded', icon: <UserDeleteOutlined />, label: 'Виключені' }
    ]
  },
  {
    key: 'structure-group',
    icon: <ApartmentOutlined />,
    label: 'Штат та посади',
    children: [
      { key: '/org-structure', icon: <BranchesOutlined />, label: 'Орг. структура' },
      { key: '/staffing', icon: <TableOutlined />, label: 'ШПО' },
      { key: '/positions', icon: <SolutionOutlined />, label: 'Перелік посад' }
    ]
  },
  {
    key: '/movements',
    icon: <SwapOutlined />,
    label: 'Переміщення'
  },
  {
    key: '/statuses',
    icon: <TagsOutlined />,
    label: 'Статуси'
  },
  {
    key: 'attendance-group',
    icon: <CalendarOutlined />,
    label: 'Табель',
    children: [
      { key: '/attendance', icon: <CalendarOutlined />, label: 'Місячний табель' },
      { key: '/formation-report', icon: <FormOutlined />, label: 'Стройова записка' }
    ]
  },
  {
    key: 'documents-group',
    icon: <FileTextOutlined />,
    label: 'Документи',
    children: [
      { key: '/orders', icon: <FileProtectOutlined />, label: 'Накази' },
      { key: '/leave', icon: <FileTextOutlined />, label: 'Відпустки' },
      { key: '/injuries', icon: <MedicineBoxOutlined />, label: 'Поранення / Втрати' },
      { key: '/documents/generate', icon: <FormOutlined />, label: 'Генератор' },
      { key: '/documents/archive', icon: <FolderOutlined />, label: 'Архів' }
    ]
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: 'Статистика'
  },
  {
    key: '/import-export',
    icon: <ImportOutlined />,
    label: 'Імпорт / Експорт'
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Налаштування'
  }
]

function findOpenKey(pathname: string): string[] {
  for (const item of menuItems) {
    if (item && 'children' in item && item.children) {
      for (const child of item.children as { key: string }[]) {
        if (child.key === pathname) {
          return [item.key as string]
        }
      }
    }
  }
  return []
}

export default function AppLayout(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [dbStatus, setDbStatus] = useState<string>('')
  const { token } = theme.useToken()

  useEffect(() => {
    window.api.dbHealth().then((result: { ok: boolean; message: string }) => {
      setDbStatus(result.ok ? 'OK' : 'Error')
    })
  }, [])

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={230}
        theme="light"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            gap: 8,
            flexShrink: 0,
            borderBottom: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <DatabaseOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
          {!collapsed && (
            <span style={{ fontSize: 16, fontWeight: 600 }}>ЕЖООС+</span>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={findOpenKey(location.pathname)}
            items={menuItems}
            onClick={onMenuClick}
            style={{ borderRight: 0 }}
          />
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 230, transition: 'margin-left 0.2s', height: '100vh', overflow: 'hidden' }}>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 48
          }}
        >
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, cursor: 'pointer', marginRight: 16, color: '#666' }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Space size={8}>
            <Tag color="blue">12 ОШР</Tag>
            <Tag color="green">4 ШБ (А0501)</Tag>
            <Tag color="orange">92 ОШБр (А1314)</Tag>
          </Space>
          <div style={{ flex: 1 }} />
          <Space size={8}>
            <span style={{ color: '#666', fontSize: 13 }}>
              {dayjs().format('DD.MM.YYYY dddd')}
            </span>
            {dbStatus && (
              <Tag color={dbStatus === 'OK' ? 'success' : 'error'}>БД: {dbStatus}</Tag>
            )}
          </Space>
        </Header>

        <Content style={{ margin: 16, overflow: 'auto', flex: 1 }}>
          <AppRoutes />
        </Content>
      </Layout>
    </Layout>
  )
}
