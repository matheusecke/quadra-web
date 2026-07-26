import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { NumberField } from '../../../components/ui/NumberField/NumberField'
import { SearchSelect } from '../../../components/ui/SearchSelect'
import type { SearchSelectOption } from '../../../components/ui/SearchSelect'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/ui/Table/Table'
import s from './TournamentRosterPanel.module.css'

export type RosterRole = 'ATHLETE' | 'COACHING_STAFF'

const ROLE_LABELS: Record<RosterRole, string> = {
  ATHLETE: 'Atleta',
  COACHING_STAFF: 'Comissão técnica',
}

export interface RosterDisplayEntry {
  id: number
  userId: number
  name: string
  jerseyNumber: number | null
  role: RosterRole
}

export interface RosterEntryDraft {
  userId: number
  role: RosterRole
  jerseyNumber?: number
}

export interface TournamentRosterPanelProps {
  roster: RosterDisplayEntry[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSearchCandidates: (q: string, role: RosterRole) => Promise<SearchSelectOption[]>
  onAdd: (entry: RosterEntryDraft) => Promise<void>
  onRemove: (id: number) => void
  onUpdate: (id: number, input: { jerseyNumber?: number | null; role?: RosterRole }) => Promise<void>
  errorMessage?: string
}

export function TournamentRosterPanel({
  roster,
  isLoading,
  isError,
  onRetry,
  onSearchCandidates,
  onAdd,
  onRemove,
  onUpdate,
  errorMessage,
}: TournamentRosterPanelProps) {
  const roleId = useId()
  const editRoleId = useId()
  const [selectedCandidate, setSelectedCandidate] = useState<SearchSelectOption | null>(null)
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('')
  const [role, setRole] = useState<RosterRole>('ATHLETE')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [draftNumber, setDraftNumber] = useState<number | ''>('')
  const [draftRole, setDraftRole] = useState<RosterRole>('ATHLETE')

  const handleRoleChange = (nextRole: RosterRole) => {
    setRole(nextRole)
    setSelectedCandidate(null)
  }

  const handleAdd = async () => {
    if (selectedCandidate == null) return
    setBusy(true)
    try {
      await onAdd({
        userId: selectedCandidate.id,
        role,
        ...(jerseyNumber === '' ? {} : { jerseyNumber }),
      })
      setSelectedCandidate(null)
      setJerseyNumber('')
      setRole('ATHLETE')
    } catch {
      // the caller surfaces the failure via errorMessage; keep the current draft
    } finally {
      setBusy(false)
    }
  }

  const startEditing = (entry: RosterDisplayEntry) => {
    setConfirmingId(null)
    setEditingId(entry.id)
    setDraftNumber(entry.jerseyNumber ?? '')
    setDraftRole(entry.role)
  }

  const handleUpdate = async () => {
    if (editingId === null || invalidJerseyDraft(draftNumber)) return
    try {
      await onUpdate(editingId, { jerseyNumber: draftNumber === '' ? null : draftNumber, role: draftRole })
      setEditingId(null)
    } catch {
      // the caller surfaces the failure via errorMessage; keep the row in edit mode
    }
  }

  return (
    <div className={s.panel}>
      {isLoading ? (
        <Skeleton width="100%" height={240} />
      ) : isError ? (
        <ErrorState title="Não foi possível carregar o elenco." onRetry={onRetry} />
      ) : roster.length > 0 ? (
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
              const invalidDraft = invalidJerseyDraft(draftNumber)

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
                    ) : (entry.jerseyNumber ?? '—')}
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
                        <Button type="button" size="sm" onClick={handleUpdate} disabled={invalidDraft}>Salvar</Button>
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
          <label className={s.label}>
            Atleta
            <SearchSelect
              value={selectedCandidate}
              onChange={setSelectedCandidate}
              onSearch={(q) => onSearchCandidates(q, role)}
              placeholder="Buscar atleta…"
            />
          </label>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="jerseyNumber">Número</label>
          <div className={s.numberWrap}>
            <NumberField
              id="jerseyNumber"
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
            onChange={(next) => handleRoleChange(next as RosterRole)}
          />
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleAdd} loading={busy} disabled={selectedCandidate == null}>
          Adicionar ao elenco
        </Button>
      </div>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}

function invalidJerseyDraft(draft: number | ''): boolean {
  return draft !== '' && (draft < 0 || draft > 99)
}
