import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
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
  const [jersey, setJersey] = useState('')
  const [role, setRole] = useState<RosterRole>('ATHLETE')
  const [busy, setBusy] = useState(false)

  const handleAdd = async () => {
    if (!selectedAthlete || !jersey) return
    setBusy(true)
    try {
      await onAdd({ athleteId: selectedAthlete, jerseyNumber: Number(jersey), role })
      setSelectedAthlete('')
      setJersey('')
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
          <select
            id={athleteId}
            className={s.select}
            value={selectedAthlete}
            onChange={(e) => setSelectedAthlete(e.target.value)}
            disabled={availableAthletes.length === 0}
          >
            <option value="" disabled>Selecione um atleta…</option>
            {availableAthletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
            ))}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor={jerseyId}>Número</label>
          <input
            id={jerseyId}
            className={s.input}
            type="number"
            min={0}
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor={roleId}>Papel</label>
          <select id={roleId} className={s.select} value={role} onChange={(e) => setRole(e.target.value as RosterRole)}>
            <option value="ATHLETE">Atleta</option>
            <option value="COACHING_STAFF">Comissão técnica</option>
          </select>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleAdd} loading={busy} disabled={!selectedAthlete || !jersey}>
          Adicionar ao elenco
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
