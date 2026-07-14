import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../cn'
import styles from './NumberField.module.css'

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number | ''
  onValueChange: (next: number | '') => void
  dense?: boolean
  controlLabel?: string
  error?: boolean
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  value,
  onValueChange,
  dense = false,
  controlLabel = 'valor',
  error = false,
  min,
  max,
  step = 1,
  disabled,
  className,
  onBlur,
  ...props
}: NumberFieldProps) {
  const current = value === '' ? null : value

  const clamp = (next: number) => {
    if (min !== undefined && next < min) return min
    if (max !== undefined && next > max) return max
    return next
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw === '') {
      onValueChange('')
      return
    }

    const parsed = Number(raw)
    if (!Number.isNaN(parsed)) onValueChange(parsed)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (current !== null) {
      const corrected = clamp(current)
      if (corrected !== current) onValueChange(corrected)
    }
    onBlur?.(event)
  }

  const nudge = (delta: number) => {
    if (current === null) {
      onValueChange(clamp(min ?? 0))
      return
    }
    onValueChange(clamp(current + delta))
  }

  const atMin = Boolean(disabled) || (min !== undefined && current !== null && current <= min)
  const atMax = Boolean(disabled) || (max !== undefined && current !== null && current >= max)

  return (
    <span className={cn(styles.root, dense && styles['root--dense'], error && styles['root--error'])}>
      <input
        type="number"
        inputMode="numeric"
        className={cn(styles.input, className)}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
      <span className={styles.stack}>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Aumentar ${controlLabel}`}
          disabled={atMax}
          onClick={() => nudge(step)}
        >
          <ChevronUp size={dense ? 9 : 11} aria-hidden="true" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Diminuir ${controlLabel}`}
          disabled={atMin}
          onClick={() => nudge(-step)}
        >
          <ChevronDown size={dense ? 9 : 11} aria-hidden="true" />
        </button>
      </span>
    </span>
  )
}
