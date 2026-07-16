import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { NumberField } from '../NumberField'
import { cn } from '../cn'
import type { DateTimeFieldProps } from './DateTimeField'
import { fromDisplay, toDisplay } from './dateDisplay'
import styles from './DateTimeField.module.css'

const pad = (value: number) => String(value).padStart(2, '0')

const toValue = (
  day: Date,
  hours: number,
  minutes: number,
  type: 'datetime-local' | 'date',
) => {
  const date = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
  return type === 'date' ? date : `${date}T${pad(hours)}:${pad(minutes)}`
}

const fromValue = (value: string) => {
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart ? datePart.split('-').map(Number) : []
  const [hours, minutes] = timePart ? timePart.split(':').map(Number) : []
  const isValid = Boolean(year && month && day)

  return {
    day: isValid ? new Date(year, month - 1, day) : new Date(),
    hours: hours ?? 19,
    minutes: minutes ?? 0,
    isEmpty: !isValid,
  }
}

const monthGrid = (viewMonth: Date): Date[] => {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1)

const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const dayLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' })
const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

type DatePickerProps = DateTimeFieldProps & { type: 'datetime-local' | 'date' }

export function DatePicker({
  value,
  onChange,
  type,
  disabled = false,
  error = false,
  id,
  ...aria
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState(() => toDisplay(value, type))
  const [draft, setDraft] = useState(() => fromValue(value))
  const [viewMonth, setViewMonth] = useState(() => fromValue(value).day)
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const open = () => {
    const parsed = fromValue(value)
    setDraft(parsed)
    setViewMonth(parsed.day)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    fieldRef.current?.focus()
  }

  const confirm = () => {
    const next = toValue(draft.day, draft.hours, draft.minutes, type)
    onChange(next)
    setText(toDisplay(next, type))
    close()
  }

  const moveDay = (amount: number) => {
    const next = new Date(draft.day)
    next.setDate(next.getDate() + amount)
    setDraft({ ...draft, day: next, isEmpty: false })
    setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1))
  }

  useEffect(() => {
    if (!isOpen) return
    dialogRef.current?.focus()

    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen])

  const onKeyDown = (event: React.KeyboardEvent) => {
    const isTimeInput = event.target instanceof HTMLInputElement
    if (isTimeInput && event.key !== 'Escape') return

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        close()
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveDay(-1)
        break
      case 'ArrowRight':
        event.preventDefault()
        moveDay(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveDay(-7)
        break
      case 'ArrowDown':
        event.preventDefault()
        moveDay(7)
        break
      case 'PageUp':
        event.preventDefault()
        setViewMonth(addMonths(viewMonth, -1))
        break
      case 'PageDown':
        event.preventDefault()
        setViewMonth(addMonths(viewMonth, 1))
        break
      case 'Enter':
        if (event.target === dialogRef.current || (event.target as HTMLElement).dataset.calendarDay) {
          event.preventDefault()
          confirm()
        }
        break
    }
  }

  const today = new Date()

  return (
    <div className={styles.root} ref={rootRef}>
      <span className={cn(styles.field, error && styles['field--error'])}>
        <input
          type="text"
          inputMode="numeric"
          id={id}
          className={styles.input}
          placeholder={type === 'date' ? 'dd/mm/aaaa' : 'dd/mm/aaaa hh:mm'}
          value={text}
          disabled={disabled}
          onChange={(event) => {
            setText(event.target.value)
            const parsed = fromDisplay(event.target.value, type)
            if (parsed) onChange(parsed)
          }}
          onBlur={() => setText(toDisplay(value, type))}
          {...aria}
        />
        <button
          type="button"
          ref={fieldRef}
          className={styles.calendarButton}
          aria-label="Abrir calendário"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => (isOpen ? close() : open())}
        >
          <Calendar size={16} aria-hidden="true" />
        </button>
      </span>

      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Escolher data e hora"
          className={styles.cal}
          tabIndex={-1}
          onKeyDown={onKeyDown}
        >
          <div className={styles.calHead}>
            <span className={styles.calMonth}>{monthLabel.format(viewMonth)}</span>
            <div className={styles.calNav}>
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.calGrid}>
            {weekdays.map((weekday) => (
              <span key={weekday} className={styles.calDow} aria-hidden="true">
                {weekday}
              </span>
            ))}
            {monthGrid(viewMonth).map((day) => (
              <button
                type="button"
                key={toValue(day, 0, 0, 'date')}
                className={cn(
                  styles.calDay,
                  day.getMonth() !== viewMonth.getMonth() && styles['calDay--out'],
                  isSameDay(day, today) && styles['calDay--today'],
                  isSameDay(day, draft.day) && styles['calDay--sel'],
                )}
                aria-label={dayLabel.format(day)}
                aria-current={isSameDay(day, today) ? 'date' : undefined}
                data-calendar-day="true"
                onClick={() => setDraft({ ...draft, day, isEmpty: false })}
              >
                {day.getDate()}
              </button>
            ))}
          </div>

          {type === 'datetime-local' && (
            <div className={styles.calTime}>
              <span className={styles.calTimeLabel}>Horário</span>
              <NumberField
                aria-label="Hora"
                controlLabel="hora"
                value={draft.hours}
                min={0}
                max={23}
                onValueChange={(hours) =>
                  setDraft({ ...draft, hours: hours === '' ? 0 : hours })
                }
              />
              <span className={styles.colon}>:</span>
              <NumberField
                aria-label="Minuto"
                controlLabel="minuto"
                value={draft.minutes}
                min={0}
                max={59}
                step={5}
                onValueChange={(minutes) =>
                  setDraft({ ...draft, minutes: minutes === '' ? 0 : minutes })
                }
              />
            </div>
          )}

          <div className={styles.calFoot}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => {
                const next = new Date()
                setDraft({ ...draft, day: next, isEmpty: false })
                setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1))
              }}
            >
              Hoje
            </button>
            <button type="button" className={styles.btnPrimary} onClick={confirm}>
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
