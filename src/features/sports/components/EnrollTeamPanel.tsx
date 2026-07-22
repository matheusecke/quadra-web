import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { parsePositiveId } from '../parsePositiveId'
import s from './EnrollTeamPanel.module.css'

export interface EnrollTeamOption {
  id: number
  name: string
}

export interface EnrollTeamPanelProps {
  availableTeams: EnrollTeamOption[]
  onEnroll: (teamId: number) => Promise<void>
  errorMessage?: string
}

export function EnrollTeamPanel({ availableTeams, onEnroll, errorMessage }: EnrollTeamPanelProps) {
  const selectId = useId()
  const [teamId, setTeamId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const handleEnroll = async () => {
    if (teamId == null) return
    setBusy(true)
    try {
      await onEnroll(teamId)
      setTeamId(null)
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
            options={availableTeams.map((team) => ({ value: String(team.id), label: team.name }))}
            value={teamId == null ? null : String(teamId)}
            onChange={(raw) => setTeamId(parsePositiveId(raw))}
            placeholder="Selecione uma equipe…"
            disabled={availableTeams.length === 0}
          />
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleEnroll} loading={busy} disabled={teamId == null}>
          Inscrever
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
