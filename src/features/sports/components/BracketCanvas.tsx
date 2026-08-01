import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, roundDisplayName, slotDisplayName } from '../sportsUtils'
import { Badge, Button, Combobox, Input, SearchSelect } from '../../../components/ui'
import type { SearchSelectOption } from '../../../components/ui/SearchSelect'
import { parsePositiveId } from '../parsePositiveId'
import type { BracketMatchView, BracketRound, BracketSlotView } from '../types'
import type { BracketTeamOption } from '../useBracketView'
import s from './BracketCanvas.module.css'

const CLEAR_OPTION = { value: '', label: 'Remover equipe' }

interface LinkedMatchProps { match: BracketMatchView }

function LinkedMatch({ match }: LinkedMatchProps) {
  const hasScore = match.homeScore !== null && match.awayScore !== null
  return (
    <div className={s.linkedMatch} aria-label="Partida vinculada">
      <Link to={`/matches/${match.id}`}>Partida #{match.id}</Link>
      <Badge>{match.status}</Badge>
      <span>{match.date ? formatDateTime(match.date) : 'Data não informada'}</span>
      <strong>{hasScore ? `${match.homeScore} × ${match.awayScore}` : 'Placar indisponível'}</strong>
    </div>
  )
}

export interface BracketCanvasProps {
  rounds: BracketRound[]
  slots: BracketSlotView[]
  teams: BracketTeamOption[]
  tournamentId: number
  canEditStructure: boolean
  busySlotId: number | null
  /** `null` clears the side. */
  onFillSide: (slotId: number, side: 'home' | 'away', tournamentTeamId: number | null) => Promise<void>
  onRenameSlot: (slotId: number, label: string | null) => Promise<void>
  onCreateSlot: (roundId: number) => Promise<void>
  onRemoveSlot: (slotId: number) => Promise<void>
  onCreateRound: () => Promise<void>
  onRenameRound: (roundId: number, label: string | null) => Promise<void>
  onRemoveRound: (roundId: number) => Promise<void>
  onSearchMatches: (slot: BracketSlotView, query: string) => Promise<SearchSelectOption[]>
  onLinkMatch: (slotId: number, matchId: number) => Promise<void>
  onUnlinkMatch: (slot: BracketSlotView) => Promise<void>
  errorMessage?: string
}

export function BracketCanvas({
  rounds, slots, teams, canEditStructure, busySlotId,
  onFillSide, onRenameSlot, onCreateSlot, onRemoveSlot, onCreateRound, onRenameRound, onRemoveRound,
  onSearchMatches, onLinkMatch, onUnlinkMatch, errorMessage,
}: BracketCanvasProps) {
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
  const [editingRoundId, setEditingRoundId] = useState<number | null>(null)
  const [roundDraft, setRoundDraft] = useState('')
  const [pendingMatchBySlot, setPendingMatchBySlot] = useState<Record<number, SearchSelectOption | null>>({})
  const [confirmingUnlinkSlotId, setConfirmingUnlinkSlotId] = useState<number | null>(null)
  const slotsOf = (roundId: number) => slots.filter((slot) => slot.roundId === roundId)
  const roundOf = (slot: BracketSlotView) => rounds.find((round) => round.id === slot.roundId) ?? { label: null }

  const renderSide = (slot: BracketSlotView, side: 'home' | 'away') => {
    const team = side === 'home' ? slot.homeTeam : slot.awayTeam
    const otherSide = side === 'home' ? slot.awayTeam : slot.homeTeam
    const label = slotDisplayName(slot, roundOf(slot))
    const options = teams.map((entry) => ({ value: String(entry.tournamentTeamId), label: entry.name, secondary: entry.shortName }))
    return <Combobox
      aria-label={`${label} — ${side === 'home' ? 'mandante' : 'visitante'}`}
      placeholder={otherSide ? '+ escolher equipe (bye)' : '+ escolher equipe'}
      options={team ? [CLEAR_OPTION, ...options] : options}
      value={team ? String(team.tournamentTeamId) : null}
      onChange={(raw) => { void onFillSide(slot.id, side, parsePositiveId(raw)) }}
    />
  }

  const renderMatchLink = (slot: BracketSlotView) => {
    if (!canEditStructure) return null
    const busy = busySlotId === slot.id

    if (slot.match) {
      if (slot.match.status === 'FINISHED') {
        return <p className={s.matchLinkNote}>Partida finalizada não pode ser desvinculada.</p>
      }
      if (confirmingUnlinkSlotId === slot.id) {
        const copy = slot.match.status === 'CANCELLED'
          ? 'Desvincular removerá a partida desta vaga.'
          : 'Desvincular cancelará a partida e ela não poderá ser reativada nesta fase.'
        return <div className={s.confirm} role="alertdialog" aria-label="Confirmar desvínculo">
          <p>{copy}</p>
          <div className={s.confirmActions}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingUnlinkSlotId(null)}>Voltar</Button>
            <Button type="button" variant="danger" size="sm" loading={busy}
              onClick={() => { void onUnlinkMatch(slot).finally(() => setConfirmingUnlinkSlotId(null)) }}>
              Confirmar desvínculo
            </Button>
          </div>
        </div>
      }
      return <Button type="button" variant="ghost" size="sm" disabled={busySlotId !== null}
        onClick={() => setConfirmingUnlinkSlotId(slot.id)}>
        Desvincular partida
      </Button>
    }

    const selected = pendingMatchBySlot[slot.id] ?? null
    return <div className={s.matchLink}>
      <SearchSelect
        value={selected}
        onChange={(option) => setPendingMatchBySlot((prev) => ({ ...prev, [slot.id]: option }))}
        onSearch={(query) => onSearchMatches(slot, query)}
        placeholder="Buscar partida…"
        disabled={busySlotId !== null}
      />
      <Button type="button" variant="secondary" size="sm" loading={busy} disabled={!selected || busySlotId !== null}
        onClick={() => {
          if (!selected) return
          void onLinkMatch(slot.id, selected.id).then(() => setPendingMatchBySlot((prev) => ({ ...prev, [slot.id]: null })))
        }}>
        Vincular partida
      </Button>
    </div>
  }

  return <div>
    <div className={s.canvas}>
      {rounds.map((round) => {
        const roundSlots = slotsOf(round.id)
        return <div className={s.round} key={round.id}>
          <div className={s.slotHeader}>
            {editingRoundId === round.id
              ? <Input aria-label="Nome da rodada" value={roundDraft}
                  onChange={(event) => setRoundDraft(event.target.value)}
                  onBlur={() => { void onRenameRound(round.id, roundDraft.trim() || null); setEditingRoundId(null) }} autoFocus />
              : <h3><button type="button" className={s.slotTitle}
                  onClick={() => { setEditingRoundId(round.id); setRoundDraft(round.label ?? '') }}>{roundDisplayName(round)}</button></h3>}
            <button type="button" className={s.remove} aria-label={`Remover ${roundDisplayName(round)}`}
              onClick={() => { void onRemoveRound(round.id) }}>×</button>
          </div>
          {roundSlots.map((slot) => {
            const label = slotDisplayName(slot, round)
            const editing = editingSlotId === slot.id
            return <article className={s.slot} key={slot.id}>
              <div className={s.slotHeader}>
                {editing
                  ? <Input aria-label="Nome da vaga" value={labelDraft}
                      onChange={(event) => setLabelDraft(event.target.value)}
                      onBlur={() => { void onRenameSlot(slot.id, labelDraft.trim() || null); setEditingSlotId(null) }} autoFocus />
                  : <button type="button" className={s.slotTitle} onClick={() => { setEditingSlotId(slot.id); setLabelDraft(slot.label ?? '') }}>{label}</button>}
                <button type="button" className={s.remove} aria-label={`Remover ${label}`} onClick={() => { void onRemoveSlot(slot.id) }}>×</button>
              </div>
              {renderSide(slot, 'home')}
              {renderSide(slot, 'away')}
              {slot.match && <LinkedMatch match={slot.match} />}
              {renderMatchLink(slot)}
            </article>
          })}
          <button type="button" className={s.ghostSlot} onClick={() => { void onCreateSlot(round.id) }}>+ Adicionar partida</button>
        </div>
      })}
      <button type="button" className={s.ghostRound} onClick={() => { void onCreateRound() }}>+ Nova rodada</button>
    </div>
    {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
  </div>
}
