import type { KeyboardEvent } from 'react'
import { Input } from '../Input'
import s from './HeightField.module.css'

export interface HeightFieldProps {
  id: string
  digits: string
  onDigitsChange: (digits: string) => void
  error?: boolean
}

function formatHeightDisplay(digits: string): string {
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  return `${padded[0]},${padded.slice(1)}m`
}

export function HeightField({ id, digits, onDigitsChange, error }: HeightFieldProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      if (digits.length < 3) onDigitsChange(digits + e.key)
    } else if (e.key === 'Backspace') {
      onDigitsChange(digits.slice(0, -1))
    } else if (!['Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleIncrement = () => {
    if (!digits) { onDigitsChange('1'); return }
    const val = parseInt(digits, 10)
    if (val < 999) onDigitsChange(String(val + 1))
  }

  const handleDecrement = () => {
    if (!digits || digits === '1') { onDigitsChange(''); return }
    onDigitsChange(String(parseInt(digits, 10) - 1))
  }

  return (
    <div className={s.wrapper}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={formatHeightDisplay(digits)}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        placeholder="0,00m"
        error={error}
        fullWidth
        className={s.input}
      />
      <div className={s.arrows}>
        <button
          type="button"
          className={s.arrow}
          onClick={handleIncrement}
          aria-label="Aumentar altura"
          tabIndex={-1}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className={s.arrow}
          onClick={handleDecrement}
          aria-label="Diminuir altura"
          tabIndex={-1}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
