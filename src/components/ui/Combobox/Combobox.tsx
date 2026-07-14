import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '../cn'
import styles from './Combobox.module.css'

export interface ComboboxOption {
  value: string
  label: string
  secondary?: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  error?: boolean
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

const SEARCH_THRESHOLD = 8

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Selecione…',
  searchable,
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Nenhum resultado',
  disabled = false,
  error = false,
  id,
  ...aria
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const hasSearch = searchable ?? options.length > SEARCH_THRESHOLD
  const visible = query
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options
  const selected = options.find((option) => option.value === value) ?? null

  const close = () => {
    setIsOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  const pick = (option: ComboboxOption) => {
    if (option.disabled) return
    onChange(option.value)
    close()
    fieldRef.current?.focus()
  }

  useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        close()
        fieldRef.current?.focus()
        break
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, visible.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(visible.length - 1)
        break
      case 'Enter':
        event.preventDefault()
        if (visible[activeIndex]) pick(visible[activeIndex])
        break
    }
  }

  return (
    <div className={styles.root} ref={rootRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        ref={fieldRef}
        className={cn(styles.field, error && styles['field--error'])}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        {...aria}
      >
        <span className={cn(styles.value, !selected && styles.placeholder)}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.popover}>
          {hasSearch && (
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                role="searchbox"
                autoFocus
                className={styles.search}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
              />
            </div>
          )}

          {visible.length === 0 ? (
            <p className={styles.empty}>{emptyMessage}</p>
          ) : (
            <ul className={styles.list} id={listId} role="listbox">
              {visible.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  data-active={index === activeIndex}
                  className={styles.option}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(option)}
                >
                  <span className={styles.optionLabel}>
                    {option.label}
                    {option.secondary && <span className={styles.secondary}>{option.secondary}</span>}
                  </span>
                  {option.value === value && (
                    <Check size={14} className={styles.tick} aria-hidden="true" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
