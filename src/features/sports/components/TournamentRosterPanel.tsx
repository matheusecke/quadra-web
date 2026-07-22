import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { NumberField } from '../../../components/ui/NumberField/NumberField'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/ui/Table/Table'
import { parsePositiveId } from '../parsePositiveId'
import s from './TournamentRosterPanel.module.css'

export type RosterRole = 'ATHLETE' | 'COACHING_STAFF'

const ROLE_LABELS: Record<RosterRole, string> = {
  ATHLETE: 'Atleta',
  COACHING_STAFF: 'Comissão técnica',
}

export interface RosterAthleteOption {
  id: number
  name: string
}

export interface RosterDisplayEntry {
  id: number
  athleteId: number
  name: string
  jerseyNumber: number
  role: RosterRole
}

export interface RosterEntryDraft {
  athleteId: number
  jerseyNumber: number
  role: RosterRole
}

export interface TournamentRosterPanelProps {
  roster: RosterDisplayEntry[]
  availableAthletes: RosterAthleteOption[]
  onAdd: (entry: RosterEntryDraft) => Promise<void> | void
  onRemove: (id: number) => void
  onUpdate: (id: number, input: { jerseyNumber?: number; role?: RosterRole }) => Promise<void>
  errorMessage?: string
}

export function TournamentRosterPanel({ roster, availableAthletes, onAdd, onRemove, onUpdate, errorMessage }: TournamentRosterPanelProps) {
  const athleteId = useId()
  const jerseyId = useId()
  const roleId = useId()
  const editRoleId = useId()
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null)
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('')
  const [role, setRole] = useState<RosterRole>('ATHLETE')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [draftNumber, setDraftNumber] = useState<number | ''>('')
  const [draftRole, setDraftRole] = useState<RosterRole>('ATHLETE')

  const handleAdd = async () => {
    if (selectedAthlete == null || jerseyNumber === '') return
    setBusy(true)
    try {
      await onAdd({ athleteId: selectedAthlete, jerseyNumber, role })
      setSelectedAthlete(null)
      setJerseyNumber('')
      setRole('ATHLETE')
    } finally {
      setBusy(false)
    }
  }

  const startEditing = (entry: RosterDisplayEntry) => {
    setConfirmingId(null)
    setEditingId(entry.id)
    setDraftNumber(entry.jerseyNumber)
    setDraftRole(entry.role)
  }

  const handleUpdate = async () => {
    if (editingId === null || draftNumber === '' || draftNumber < 0 || draftNumber > 99) return
    await onUpdate(editingId, { jerseyNumber: draftNumber, role: draftRole })
    setEditingId(null)
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
              <TableHeaderCell aria-label="Ações" />
            </TableRow>
          </TableHead>
          <TableBody>
            {roster.map((entry) => {
              const isEditing = editingId === entry.id
              const isConfirming = confirmingId === entry.id
              const invalidDraftNumber = draftNumber === '' || draftNumber < 0 || draftNumber > 99

              return (
                <TableRow key={entry.id} className={s.rosterRow}>
                  <TableCell>
                    {isEditing ? (
                      <div className={s.numberWrap}>
                        <NumberField
                          aria-label="Número"
                          controlLabel="número"
                          value={draftNumber}
                          onValueChange={setDraftNumber}
                          min={0}
                          max={99}
                        />
                      </div>
                    ) : entry.jerseyNumber}
                  </TableCell>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className={`${s.field} ${s.roleField}`}>
                        <label className={s.label} htmlFor={editRoleId}>Papel</label>
                        <Combobox
                          id={editRoleId}
                          options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
                          value={draftRole}
                          onChange={(next) => setDraftRole(next as RosterRole)}
                        />
                      </div>
                    ) : isConfirming ? (
                      <span className={s.confirmation}>Remover {entry.name} do elenco neste campeonato?</span>
                    ) : ROLE_LABELS[entry.role]}
                  </TableCell>
                  <TableCell className={s.actionCell}>
                    {isEditing ? (
                      <div className={`${s.actions} ${s.actionsVisible}`}>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                        <Button type="button" size="sm" onClick={handleUpdate} disabled={invalidDraftNumber}>Salvar</Button>
                      </div>
                    ) : isConfirming ? (
                      <div className={`${s.actions} ${s.actionsVisible}`}>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingId(null)}>Cancelar</Button>
                        <Button type="button" variant="danger" size="sm" onClick={() => onRemove(entry.id)}>Confirmar</Button>
                      </div>
                    ) : (
                      <div className={s.actions}>
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEditing(entry)}>Editar</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingId(entry.id)}>Remover</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState title="Elenco vazio." description="Adicione atletas ao elenco desta equipe no campeonato." />
      )}

      <div className={s.addRow}>
        <div className={`${s.field} ${s.roleField}`}>
          <label className={s.label} htmlFor={athleteId}>Atleta</label>
          <Combobox
            id={athleteId}
            options={availableAthletes.map((athlete) => ({ value: String(athlete.id), label: athlete.name }))}
            value={selectedAthlete == null ? null : String(selectedAthlete)}
            onChange={(raw) => setSelectedAthlete(parsePositiveId(raw))}
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
        <Button type="button" variant="primary" size="sm" onClick={handleAdd} loading={busy} disabled={selectedAthlete == null || jerseyNumber === ''}>
          Adicionar ao elenco
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
