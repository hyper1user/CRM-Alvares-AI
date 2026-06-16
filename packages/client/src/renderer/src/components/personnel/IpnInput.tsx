import { Input, type InputProps } from 'antd'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { validateIpn, birthDateFromIpn, genderFromIpn } from '@shared/validators'
import { useMemo } from 'react'
import dayjs from 'dayjs'

interface IpnInputProps extends Omit<InputProps, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onAutoFill?: (data: { dateOfBirth?: string; gender?: string }) => void
}

export default function IpnInput({ value = '', onChange, onAutoFill, ...rest }: IpnInputProps) {
  const isComplete = value.length === 10
  const isValid = useMemo(() => (isComplete ? validateIpn(value) : null), [value, isComplete])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
    onChange?.(raw)

    // Auto-fill when 10 valid digits entered
    if (raw.length === 10 && validateIpn(raw) && onAutoFill) {
      const dob = birthDateFromIpn(raw)
      const gender = genderFromIpn(raw)
      onAutoFill({
        dateOfBirth: dob ? dayjs(dob).format('YYYY-MM-DD') : undefined,
        gender: gender ?? undefined
      })
    }
  }

  const suffix = isComplete ? (
    isValid ? (
      <CheckCircleFilled style={{ color: '#52c41a' }} />
    ) : (
      <CloseCircleFilled style={{ color: '#ff4d4f' }} />
    )
  ) : null

  return (
    <Input
      {...rest}
      value={value}
      onChange={handleChange}
      maxLength={10}
      placeholder="0000000000"
      suffix={suffix}
      status={isComplete && !isValid ? 'error' : undefined}
      style={{
        borderColor: isComplete ? (isValid ? '#52c41a' : '#ff4d4f') : undefined,
        ...rest.style
      }}
    />
  )
}
