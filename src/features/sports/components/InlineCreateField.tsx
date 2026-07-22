import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { Input } from '../../../components/ui/Input/Input'
import { parsePositiveId } from '../parsePositiveId'
import s from './InlineCreateField.module.css'

export interface InlineCreateOption {
  id: number
  label: string
}

export interface InlineCreateFieldProps {
  label: string
  options: InlineCreateOption[]
  value: number | null
  onChange: (id: number) => void
  onCreate: (label: string) => Promise<{ id: number }>
  createLabel: string
}

export function InlineCreateField({ label, options, value, onChange, onCreate, createLabel }: InlineCreateFieldProps) {
  const selectId = useId()
  const [isCreating, setIsCreating] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const handleAdd = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const created = await onCreate(trimmed)
      onChange(created.id)
      setText('')
      setIsCreating(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.wrap}>
      <label className={s.label} htmlFor={selectId}>{label}</label>
      <div className={s.row}>
        <div className={s.controlWrap}>
          <Combobox
            id={selectId}
            options={options.map((option) => ({ value: String(option.id), label: option.label }))}
            value={value == null ? null : String(value)}
            onChange={(raw) => { const id = parsePositiveId(raw); if (id != null) onChange(id) }}
            placeholder="Selecione…"
          />
        </div>
        {!isCreating && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(true)}>
            + {createLabel}
          </Button>
        )}
      </div>
      {isCreating && (
        <div className={s.createRow}>
          <Input
            aria-label={`Nova ${label}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
          />
          <Button type="button" variant="primary" size="sm" onClick={handleAdd} loading={busy}>
            Adicionar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCreating(false); setText('') }}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
