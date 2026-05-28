import { useState, useRef, useCallback } from 'react'
import { Select } from 'antd'

interface PersonnelOption {
  id: number
  fullName: string
  rankName: string | null
  ipn: string
}

interface Props {
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  placeholder?: string
}

export default function PersonnelSearchSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Пошук за ПІБ або ІПН...'
}: Props): JSX.Element {
  const [options, setOptions] = useState<PersonnelOption[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query || query.length < 2) {
      setOptions([])
      return
    }

    timerRef.current = setTimeout(() => {
      setLoading(true)
      window.api
        .personnelSearch(query)
        .then((result) => {
          setOptions(
            (result ?? []).map((p: PersonnelOption) => ({
              id: p.id,
              fullName: p.fullName,
              rankName: p.rankName,
              ipn: p.ipn
            }))
          )
        })
        .catch(() => setOptions([]))
        .finally(() => setLoading(false))
    }, 300)
  }, [])

  return (
    <Select
      showSearch
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      loading={loading}
      filterOption={false}
      onSearch={handleSearch}
      allowClear
      options={options.map((p) => ({
        value: p.id,
        label: `${p.rankName ? p.rankName + ' ' : ''}${p.fullName} (${p.ipn})`
      }))}
      style={{ width: '100%' }}
      notFoundContent={loading ? 'Пошук...' : 'Введіть мінімум 2 символи'}
    />
  )
}
