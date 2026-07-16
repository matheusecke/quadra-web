import { Combobox } from '../../../components/ui/Combobox/Combobox'
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
      <div className={s.controlWrap}>
        <Combobox
          id="mvp-select"
          options={[
            { value: '', label: '— nenhum —' },
            ...candidates.map((candidate) => ({
              value: candidate.tournamentRosterId,
              label: `${candidate.name} (${candidate.teamName})`,
            })),
          ]}
          value={value}
          onChange={(next) => onChange(next || null)}
        />
      </div>
    </Field>
  )
}
