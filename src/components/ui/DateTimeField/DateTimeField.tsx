import { cn } from '../cn'
import { useCoarsePointer } from '../useCoarsePointer'
import { DatePicker } from './DatePicker'
import styles from './DateTimeField.module.css'

export interface DateTimeFieldProps {
  value: string
  onChange: (value: string) => void
  type?: 'datetime-local' | 'date'
  disabled?: boolean
  error?: boolean
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function DateTimeField({
  value,
  onChange,
  type = 'datetime-local',
  disabled,
  error,
  id,
  ...aria
}: DateTimeFieldProps) {
  const isCoarse = useCoarsePointer()

  if (isCoarse) {
    return (
      <input
        type={type}
        id={id}
        className={cn(styles.nativeField, error && styles['nativeField--error'])}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        {...aria}
      />
    )
  }

  return (
    <DatePicker
      value={value}
      onChange={onChange}
      type={type}
      disabled={disabled}
      error={error}
      id={id}
      {...aria}
    />
  )
}
