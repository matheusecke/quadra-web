import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
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
        <select
          id={selectId}
          className={s.select}
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          disabled={availableTeams.length === 0}
        >
          <option value="" disabled>Selecione uma equipe…</option>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <Button type="button" variant="primary" size="sm" onClick={handleEnroll} loading={busy} disabled={!teamId}>
          Inscrever
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
