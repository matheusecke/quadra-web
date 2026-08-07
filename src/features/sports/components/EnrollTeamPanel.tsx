import { useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { SearchSelect } from '../../../components/ui/SearchSelect'
import type { SearchSelectOption } from '../../../components/ui/SearchSelect'
import s from './EnrollTeamPanel.module.css'

export interface EnrollTeamPanelProps {
  onSearch: (q: string) => Promise<SearchSelectOption[]>
  onEnroll: (teamId: number) => Promise<void>
  errorMessage?: string
}

export function EnrollTeamPanel({ onSearch, onEnroll, errorMessage }: EnrollTeamPanelProps) {
  const [selected, setSelected] = useState<SearchSelectOption | null>(null)
  const [busy, setBusy] = useState(false)

  const handleEnroll = async () => {
    if (selected == null) return
    setBusy(true)
    try {
      await onEnroll(selected.id)
      setSelected(null)
    } catch {
      // the caller surfaces the failure via errorMessage; keep the current selection
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.panel}>
      <div className={s.row}>
        <label className={s.label}>
          Equipe
          <div className={s.controlWrap}>
            <SearchSelect value={selected} onChange={setSelected} onSearch={onSearch} placeholder="Buscar equipe…" />
          </div>
        </label>
        <Button type="button" variant="primary" size="sm" onClick={handleEnroll} loading={busy} disabled={selected == null}>
          Inscrever
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
