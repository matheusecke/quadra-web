import { useEffect, useRef, useState } from 'react'
import popover from '../Combobox/Combobox.module.css'
import s from './SearchSelect.module.css'

export type SearchSelectOption = {
  id: number
  label: string
  secondary?: string
}

type Props = {
  value: SearchSelectOption | null
  onChange: (option: SearchSelectOption | null) => void
  onSearch: (q: string) => Promise<SearchSelectOption[]>
  placeholder?: string
  disabled?: boolean
}

export function SearchSelect({ value, onChange, onSearch, placeholder = 'Buscar...', disabled = false }: Props) {
  const [inputText, setInputText] = useState(value?.label ?? '')
  const [results, setResults] = useState<SearchSelectOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputText(value?.label ?? '')
  }, [value])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleInput = (q: string) => {
    setInputText(q)
    onChange(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const res = await onSearch(q.trim())
        setResults(res)
        setIsOpen(true)
      } catch {
        setIsError(true)
        setResults([])
        setIsOpen(true)
      } finally {
        setIsLoading(false)
      }
    }, 350)
  }

  const handleSelect = (option: SearchSelectOption) => {
    onChange(option)
    setInputText(option.label)
    setIsOpen(false)
    setResults([])
  }

  const handleClear = () => {
    onChange(null)
    setInputText('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div className={s.wrap} ref={containerRef}>
      <div className={s.inputRow}>
        <input
          className={s.input}
          type="text"
          value={inputText}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {(value !== null || inputText) && !disabled && (
          <button type="button" className={s.clearBtn} onClick={handleClear} aria-label="Limpar seleção">✕</button>
        )}
      </div>
      {isOpen && (
        <div className={popover.popover}>
          {isLoading && (
            <p className={s.loading}>Buscando...</p>
          )}
          {!isLoading && isError && (
            <p className={popover.empty}>Erro ao buscar. Tente novamente.</p>
          )}
          {!isLoading && !isError && results.length === 0 && (
            <p className={popover.empty}>Nenhum resultado encontrado.</p>
          )}
          {!isLoading && !isError && results.length > 0 && (
            <ul className={popover.list} role="listbox">
              {results.map((opt) => (
                <li
                  key={opt.id}
                  role="option"
                  className={popover.option}
                  aria-selected={value?.id === opt.id}
                  tabIndex={0}
                  onClick={() => handleSelect(opt)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleSelect(opt)
                    }
                  }}
                >
                  <span className={popover.optionLabel}>
                    {opt.label}
                    {opt.secondary && <span className={popover.secondary}>{opt.secondary}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
