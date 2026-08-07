import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { Field } from '../../../components/ui/Field/Field'
import { parsePositiveId } from '../parsePositiveId'
import s from './MvpSelect.module.css'

export interface MvpCandidate {
  tournamentRosterId: number
  athleteId: number
  name: string
  teamName: string
}

export interface MvpSelectProps {
  candidates: MvpCandidate[]
  value: number | null
  onChange: (tournamentRosterId: number | null) => void
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
              value: String(candidate.tournamentRosterId),
              label: `${candidate.name} (${candidate.teamName})`,
            })),
          ]}
          value={value == null ? null : String(value)}
          onChange={(next) => onChange(next === '' ? null : parsePositiveId(next))}
        />
      </div>
    </Field>
  )
}
