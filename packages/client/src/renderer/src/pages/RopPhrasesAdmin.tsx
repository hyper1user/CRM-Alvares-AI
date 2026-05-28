import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Space, Input, Typography, App, Alert } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, ClearOutlined } from '@ant-design/icons'

const { Paragraph, Text } = Typography
const { TextArea } = Input

const SLOTS = [1, 2, 3, 4] as const
const STORAGE_KEY = (slot: number): string => `rop_phrase_${slot}`

/**
 * v1.7.1: Адмінка ROP-фраз (4 фрази для placeholder'ів {{ROP1}}..{{ROP4}}
 * у шаблонах Розпорядження, які мають їх — Variants A, B, C, F).
 *
 * Зберігається у generic-таблиці `settings` як key-value пари
 * `rop_phrase_<slot>` → текст. Якщо фраза порожня, відповідний параграф
 * у згенерованому документі видаляється (pre-render mutation у
 * disposition-builder.ts).
 *
 * Format у Alvares-AI/ROP.txt: «{{ROP1}} текст завдання\n...». Тут юзер
 * вводить лише текст (без маркера).
 */
export default function RopPhrasesAdmin(): JSX.Element {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [phrases, setPhrases] = useState<Record<number, string>>({ 1: '', 2: '', 3: '', 4: '' })
  const [initial, setInitial] = useState<Record<number, string>>({ 1: '', 2: '', 3: '', 4: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      const all = (await window.api.settingsGetAll()) as Record<string, string>
      const loaded: Record<number, string> = { 1: '', 2: '', 3: '', 4: '' }
      for (const slot of SLOTS) {
        loaded[slot] = all[STORAGE_KEY(slot)] ?? ''
      }
      setPhrases(loaded)
      setInitial(loaded)
      setLoading(false)
    })()
  }, [])

  const isDirty = SLOTS.some((s) => phrases[s] !== initial[s])

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      for (const slot of SLOTS) {
        if (phrases[slot] !== initial[slot]) {
          await window.api.settingsSet(STORAGE_KEY(slot), phrases[slot])
        }
      }
      setInitial({ ...phrases })
      message.success('Фрази збережено')
    } catch (err) {
      message.error('Помилка збереження: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleClearAll = (): void => {
    setPhrases({ 1: '', 2: '', 3: '', 4: '' })
  }

  return (
    <>
      <div className="page-header">
        <div className="titles">
          <div
            className="eyebrow"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/settings')}
          >
            ← Налаштування
          </div>
          <h1>Фрази для бойових завдань (РОП)</h1>
          <div className="sub">
            До 4 фраз, що підставляються у плейсхолдери {'{{ROP1}}..{{ROP4}}'} шаблонів Бойового розпорядження
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => navigate('/settings')}>
            <ArrowLeftOutlined />
            Назад
          </button>
          <button className="btn ghost" onClick={handleClearAll} disabled={loading || saving}>
            <ClearOutlined />
            Очистити
          </button>
          <button
            className="btn primary"
            onClick={handleSave}
            disabled={!isDirty || loading || saving}
          >
            <SaveOutlined />
            {saving ? 'Збереження…' : isDirty ? 'Зберегти' : 'Збережено'}
          </button>
        </div>
      </div>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Як це працює"
          description={
            <div>
              <Paragraph style={{ marginBottom: 4 }}>
                Шаблони Бойового розпорядження (Variants <Text code>A</Text>, <Text code>B</Text>,
                {' '}<Text code>C</Text>, <Text code>F</Text>) містять плейсхолдери{' '}
                <Text code>{'{{ROP1}}'}</Text>..<Text code>{'{{ROP4}}'}</Text>, які підставляються
                фразами з цієї адмінки.
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                Якщо фраза порожня, відповідний абзац видаляється з документу повністю
                (без візуального «⊳ »-пустого артефакту).
              </Paragraph>
            </div>
          }
        />

        {SLOTS.map((slot) => (
          <Card
            key={slot}
            title={
              <Space>
                <Text code>{`{{ROP${slot}}}`}</Text>
                <span>— фраза {slot}</span>
              </Space>
            }
            size="small"
            loading={loading}
          >
            <TextArea
              value={phrases[slot]}
              onChange={(e) =>
                setPhrases((prev) => ({ ...prev, [slot]: e.target.value }))
              }
              placeholder="Наприклад: спостерігати за противником у секторі №3 з 0600 до 1800"
              rows={3}
              autoSize={{ minRows: 2, maxRows: 6 }}
              disabled={saving}
            />
            <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
              {phrases[slot]
                ? `${phrases[slot].length} символів — увійде у документ`
                : 'порожньо — абзац буде видалений з документу'}
            </Text>
          </Card>
        ))}
      </Space>
    </>
  )
}
