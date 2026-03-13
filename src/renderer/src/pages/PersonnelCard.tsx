import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tabs,
  Button,
  Space,
  Spin,
  Typography,
  Result,
  Divider,
  Table,
  Tag,
  Badge
} from 'antd'
import { ArrowLeftOutlined, EditOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons'
import { usePersonnelCard } from '../hooks/usePersonnel'
import { usePersonMovements } from '../hooks/useMovements'
import { usePersonStatusHistory } from '../hooks/useStatusHistory'
import { useLookups } from '../hooks/useLookups'
import RankBadge from '../components/personnel/RankBadge'
import StatusBadge from '../components/personnel/StatusBadge'
import PersonnelForm from '../components/personnel/PersonnelForm'
import MovementForm from '../components/movements/MovementForm'
import MovementTimeline from '../components/movements/MovementTimeline'
import StatusHistoryForm from '../components/statuses/StatusHistoryForm'
import StatusTimeline from '../components/statuses/StatusTimeline'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return dayjs(d).format('DD.MM.YYYY')
}

export default function PersonnelCard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: person, loading, refetch } = usePersonnelCard(id ? Number(id) : null)
  const { bloodTypes, educationLevels, contractTypes, statusTypes } = useLookups()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [movementDrawerOpen, setMovementDrawerOpen] = useState(false)
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false)
  const {
    data: personMovements,
    loading: movementsLoading,
    refetch: refetchMovements
  } = usePersonMovements(id ? Number(id) : null)
  const {
    data: personStatuses,
    loading: statusesLoading,
    refetch: refetchStatuses
  } = usePersonStatusHistory(id ? Number(id) : null)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!person) {
    return (
      <Result
        status="404"
        title="Особу не знайдено"
        subTitle={`Запис з ID ${id} не існує`}
        extra={
          <Button onClick={() => navigate('/personnel')}>Повернутися до реєстру</Button>
        }
      />
    )
  }

  const bloodTypeName = person.bloodTypeId
    ? bloodTypes.find((b) => b.id === person.bloodTypeId)?.name
    : null
  const educationName = person.educationLevelId
    ? educationLevels.find((e) => e.id === person.educationLevelId)?.name
    : null
  const contractName = person.contractTypeId
    ? contractTypes.find((c) => c.id === person.contractTypeId)?.name
    : null
  const statusColor = person.currentStatusCode
    ? statusTypes.find((s) => s.code === person.currentStatusCode)?.colorCode
    : null

  const tabItems = [
    {
      key: 'general',
      label: 'Загальна інформація',
      children: (
        <>
          <Descriptions bordered column={2} size="small" title="Основні дані">
            <Descriptions.Item label="РНОКПП (ІПН)">{person.ipn}</Descriptions.Item>
            <Descriptions.Item label="ПІБ">{person.fullName}</Descriptions.Item>
            <Descriptions.Item label="Позивний">{person.callsign || '—'}</Descriptions.Item>
            <Descriptions.Item label="Телефон">{person.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Дата народження">
              {formatDate(person.dateOfBirth)}
            </Descriptions.Item>
            <Descriptions.Item label="Стать">
              {person.gender === 'ч' ? 'Чоловіча' : person.gender === 'ж' ? 'Жіноча' : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Особовий номер">
              {person.personalNumber || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Статус запису">
              {person.status}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions bordered column={2} size="small" title="Службові дані">
            <Descriptions.Item label="Звання">
              <RankBadge rankName={person.rankName} category={person.rankCategory} />
            </Descriptions.Item>
            <Descriptions.Item label="Вид служби">{person.serviceType || '—'}</Descriptions.Item>
            <Descriptions.Item label="Контракт">{contractName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Дата контракту">
              {formatDate(person.contractDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Закінчення контракту">
              {formatDate(person.contractEndDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Підрозділ">
              {person.currentSubdivision || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Посада">
              {person.positionTitle || person.currentPositionIdx || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата зарахування">
              {formatDate(person.enrollmentDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Наказ зарахування">
              {person.enrollmentOrderNum || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Звідки прибув">
              {person.arrivedFrom || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Наказ про звання">
              {person.rankOrderInfo || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата наказу звання">
              {formatDate(person.rankOrderDate)}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions bordered column={2} size="small" title="Документи">
            <Descriptions.Item label="ID-документ">
              {[person.idDocType, person.idDocSeries, person.idDocNumber]
                .filter(Boolean)
                .join(' ') || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Паспорт">
              {[person.passportSeries, person.passportNumber].filter(Boolean).join(' ') || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Паспорт виданий">
              {person.passportIssuedBy || '—'} {formatDate(person.passportIssuedDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Військовий квиток">
              {[person.militaryIdSeries, person.militaryIdNumber].filter(Boolean).join(' ') || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="УБД">
              {[person.ubdSeries, person.ubdNumber].filter(Boolean).join(' ') || '—'}
              {person.ubdDate ? ` від ${formatDate(person.ubdDate)}` : ''}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions bordered column={2} size="small" title="Персональне">
            <Descriptions.Item label="Група крові">{bloodTypeName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Освіта">{educationName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Навч. заклад">
              {person.educationInstitution || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Місце народження">
              {person.birthplace || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Адреса фактична" span={2}>
              {person.addressActual || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Адреса реєстрації" span={2}>
              {person.addressRegistered || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Сімейний стан">
              {person.maritalStatus || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Громадянство">
              {person.citizenship || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Родичі" span={2}>
              {person.relativesInfo || '—'}
            </Descriptions.Item>
          </Descriptions>

          {person.notes && (
            <>
              <Divider />
              <Descriptions bordered column={1} size="small" title="Примітки">
                <Descriptions.Item>{person.notes}</Descriptions.Item>
              </Descriptions>
            </>
          )}
        </>
      )
    },
    {
      key: 'movements',
      label: (
        <Badge count={personMovements.length} size="small" offset={[8, 0]} color="blue">
          Переміщення
        </Badge>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text strong>
              Історія переміщень ({personMovements.length})
            </Typography.Text>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setMovementDrawerOpen(true)}
            >
              Додати
            </Button>
          </div>
          <Table
            dataSource={personMovements}
            rowKey="id"
            size="small"
            loading={movementsLoading}
            pagination={false}
            scroll={{ x: 900 }}
            columns={[
              {
                title: 'Тип',
                dataIndex: 'orderType',
                width: 130,
                render: (text: string) => <Tag color="blue">{text}</Tag>
              },
              {
                title: 'Посада (на)',
                dataIndex: 'positionTitle',
                width: 200,
                ellipsis: true,
                render: (_: unknown, record: typeof personMovements[0]) =>
                  record.positionTitle || record.positionIndex || '—'
              },
              {
                title: 'Посада (з)',
                dataIndex: 'previousPositionTitle',
                width: 200,
                ellipsis: true,
                render: (_: unknown, record: typeof personMovements[0]) =>
                  record.previousPositionTitle || record.previousPosition || '—'
              },
              {
                title: 'Дата з',
                dataIndex: 'dateFrom',
                width: 110,
                render: (text: string) => (text ? dayjs(text).format('DD.MM.YYYY') : '—')
              },
              {
                title: 'Наказ',
                dataIndex: 'orderNumber',
                width: 180,
                ellipsis: true,
                render: (_: unknown, record: typeof personMovements[0]) => {
                  const parts = [
                    record.orderIssuer,
                    record.orderNumber ? `№${record.orderNumber}` : null,
                    record.orderDate ? `від ${dayjs(record.orderDate).format('DD.MM.YYYY')}` : null
                  ].filter(Boolean)
                  return parts.length > 0 ? parts.join(' ') : '—'
                }
              },
              {
                title: 'Активне',
                dataIndex: 'isActive',
                width: 80,
                render: (val: boolean) =>
                  val ? <Tag color="green">Так</Tag> : <Tag color="default">Ні</Tag>
              }
            ]}
          />
          <Divider>Часова шкала</Divider>
          <MovementTimeline movements={personMovements} />
        </Space>
      )
    },
    {
      key: 'statuses',
      label: (
        <Badge count={personStatuses.length} size="small" offset={[8, 0]} color="orange">
          Статуси
        </Badge>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text strong>
              Історія статусів ({personStatuses.length})
            </Typography.Text>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setStatusDrawerOpen(true)}
            >
              Додати
            </Button>
          </div>
          <Table
            dataSource={personStatuses}
            rowKey="id"
            size="small"
            loading={statusesLoading}
            pagination={false}
            scroll={{ x: 800 }}
            columns={[
              {
                title: 'Статус',
                dataIndex: 'statusName',
                width: 200,
                render: (_: unknown, record: typeof personStatuses[0]) => (
                  <Tag color={record.statusColor || 'default'}>
                    {record.statusCode} — {record.statusName}
                  </Tag>
                )
              },
              {
                title: 'Група',
                dataIndex: 'groupName',
                width: 140
              },
              {
                title: 'Дата з',
                dataIndex: 'dateFrom',
                width: 110,
                render: (text: string) => (text ? dayjs(text).format('DD.MM.YYYY') : '—')
              },
              {
                title: 'Дата по',
                dataIndex: 'dateTo',
                width: 110,
                render: (text: string) => (text ? dayjs(text).format('DD.MM.YYYY') : '—')
              },
              {
                title: 'Присутність',
                dataIndex: 'presenceGroup',
                width: 100,
                render: (text: string) => text || '—'
              },
              {
                title: 'Поточний',
                dataIndex: 'isLast',
                width: 80,
                render: (val: boolean) =>
                  val ? <Tag color="green">Так</Tag> : <Tag color="default">Ні</Tag>
              },
              {
                title: 'Коментар',
                dataIndex: 'comment',
                width: 200,
                ellipsis: true,
                render: (text: string) => text || '—'
              }
            ]}
          />
          <Divider>Часова шкала</Divider>
          <StatusTimeline statuses={personStatuses} />
        </Space>
      )
    },
    {
      key: 'documents',
      label: 'Документи',
      children: (
        <Result
          icon={<></>}
          title="Документи"
          subTitle="Буде реалізовано у Тижнях 9-12"
        />
      )
    },
    {
      key: 'leave',
      label: 'Відпустки',
      children: (
        <Result
          icon={<></>}
          title="Відпустки"
          subTitle="Буде реалізовано у Тижні 10"
        />
      )
    }
  ]

  return (
    <>
      <Card>
        {/* Header */}
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" size="middle" wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/personnel')}
            >
              Назад
            </Button>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserOutlined style={{ fontSize: 24, color: '#999' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {person.fullName}
              </Title>
              <Space size="small">
                <RankBadge rankName={person.rankName} category={person.rankCategory} />
                <StatusBadge
                  statusCode={person.currentStatusCode}
                  statusName={person.statusName}
                  colorCode={statusColor}
                />
                {person.currentSubdivision && (
                  <Text type="secondary">{person.currentSubdivision}</Text>
                )}
                {(person.positionTitle || person.currentPositionIdx) && (
                  <Text type="secondary">
                    | {person.positionTitle || person.currentPositionIdx}
                  </Text>
                )}
              </Space>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setDrawerOpen(true)}
              >
                Редагувати
              </Button>
            </div>
          </Space>

          <Tabs items={tabItems} defaultActiveKey="general" />
        </Space>
      </Card>

      <PersonnelForm
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={refetch}
        editRecord={person as any}
      />

      <MovementForm
        open={movementDrawerOpen}
        onClose={() => setMovementDrawerOpen(false)}
        onSaved={() => {
          refetchMovements()
          refetch()
        }}
        personnelId={person.id}
        currentPositionIdx={person.currentPositionIdx}
      />

      <StatusHistoryForm
        open={statusDrawerOpen}
        onClose={() => setStatusDrawerOpen(false)}
        onSaved={() => {
          refetchStatuses()
          refetch()
        }}
        personnelId={person.id}
      />
    </>
  )
}
