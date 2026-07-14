import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { NumberField } from '../../../components/ui/NumberField/NumberField'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/ui/Table/Table'
import s from './TournamentRosterPanel.module.css'

export type RosterRole = 'ATHLETE' | 'COACHING_STAFF'

const ROLE_LABELS: Record<RosterRole, string> = {
  ATHLETE: 'Atleta',
  COACHING_STAFF: 'Comissão técnica',
}

export interface RosterAthleteOption {
  id: string
  name: string
}

export interface RosterDisplayEntry {
  athleteId: string
  name: string
  jerseyNumber: number
  role: RosterRole
}

export interface RosterEntryDraft {
  athleteId: string
  jerseyNumber: number
  role: RosterRole
}

export interface TournamentRosterPanelProps {
  roster: RosterDisplayEntry[]
  availableAthletes: RosterAthleteOption[]
  onAdd: (entry: RosterEntryDraft) => Promise<void> | void
  errorMessage?: string
}

export function TournamentRosterPanel({ roster, availableAthletes, onAdd, errorMessage }: TournamentRosterPanelProps) {
  const athleteId = useId()
  const jerseyId = useId()
  const roleId = useId()
  const [selectedAthlete, setSelectedAthlete] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('')
  const [role, setRole] = useState<RosterRole>('ATHLETE')
  const [busy, setBusy] = useState(false)

  const handleAdd = async () => {
    if (!selectedAthlete || jerseyNumber === '') return
    setBusy(true)
    try {
      await onAdd({ athleteId: selectedAthlete, jerseyNumber, role })
      setSelectedAthlete('')
      setJerseyNumber('')
      setRole('ATHLETE')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.panel}>
      {roster.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Número</TableHeaderCell>
              <TableHeaderCell>Atleta</TableHeaderCell>
              <TableHeaderCell>Papel</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roster.map((entry) => (
              <TableRow key={entry.athleteId}>
                <TableCell>{entry.jerseyNumber}</TableCell>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{ROLE_LABELS[entry.role]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState title="Elenco vazio." description="Adicione atletas ao elenco desta equipe no campeonato." />
      )}

      <div className={s.addRow}>
        <div className={s.field}>
          <label className={s.label} htmlFor={athleteId}>Atleta</label>
          <Combobox
            id={athleteId}
            options={availableAthletes.map((athlete) => ({ value: athlete.id, label: athlete.name }))}
            value={selectedAthlete || null}
            onChange={setSelectedAthlete}
            placeholder="Selecione um atleta…"
            disabled={availableAthletes.length === 0}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor={jerseyId}>Número</label>
          <div className={s.numberWrap}>
            <NumberField
              id={jerseyId}
              aria-label="Número"
              controlLabel="número"
              value={jerseyNumber}
              onValueChange={setJerseyNumber}
              min={0}
              max={99}
            />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor={roleId}>Papel</label>
          <Combobox
            id={roleId}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
            value={role}
            onChange={(next) => setRole(next as RosterRole)}
          />
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleAdd} loading={busy} disabled={!selectedAthlete || jerseyNumber === ''}>
          Adicionar ao elenco
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
