import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import s from './EnrollTeamPanel.module.css'

export interface EnrollTeamOption {
  id: string
  name: string
}

export interface EnrollTeamPanelProps {
  availableTeams: EnrollTeamOption[]
  onEnroll: (teamId: string) => Promise<void>
  errorMessage?: string
}

export function EnrollTeamPanel({ availableTeams, onEnroll, errorMessage }: EnrollTeamPanelProps) {
  const selectId = useId()
  const [teamId, setTeamId] = useState('')
  const [busy, setBusy] = useState(false)

  const handleEnroll = async () => {
    if (!teamId) return
    setBusy(true)
    try {
      await onEnroll(teamId)
      setTeamId('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.panel}>
      <div className={s.row}>
        <label className={s.label} htmlFor={selectId}>Equipe</label>
        <div className={s.controlWrap}>
          <Combobox
            id={selectId}
            options={availableTeams.map((team) => ({ value: team.id, label: team.name }))}
            value={teamId || null}
            onChange={setTeamId}
            placeholder="Selecione uma equipe…"
            disabled={availableTeams.length === 0}
          />
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleEnroll} loading={busy} disabled={!teamId}>
          Inscrever
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
