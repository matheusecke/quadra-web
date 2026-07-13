import { Field } from '../../../components/ui/Field/Field'
import s from './MvpSelect.module.css'

export interface MvpCandidate {
  tournamentRosterId: string
  athleteId: string
  name: string
  teamName: string
}

export interface MvpSelectProps {
  candidates: MvpCandidate[]
  value: string | null
  onChange: (tournamentRosterId: string | null) => void
}

export function MvpSelect({ candidates, value, onChange }: MvpSelectProps) {
  return (
    <Field label="MVP da partida" id="mvp-select">
      <select
        id="mvp-select"
        className={s.select}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">— nenhum —</option>
        {candidates.map((candidate) => (
          <option key={candidate.tournamentRosterId} value={candidate.tournamentRosterId}>
            {candidate.name} ({candidate.teamName})
          </option>
        ))}
      </select>
    </Field>
  )
}
