import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, roundDisplayName, slotDisplayName } from '../sportsUtils'
import { Badge, Combobox, Input } from '../../../components/ui'
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
  /** `null` clears the side. */
  onFillSide: (slotId: number, side: 'home' | 'away', tournamentTeamId: number | null) => Promise<void>
  onRenameSlot: (slotId: number, label: string | null) => Promise<void>
  onCreateSlot: (roundId: number) => Promise<void>
  onRemoveSlot: (slotId: number) => Promise<void>
  onCreateRound: () => Promise<void>
  onRenameRound: (roundId: number, label: string | null) => Promise<void>
  onRemoveRound: (roundId: number) => Promise<void>
  errorMessage?: string
}

export function BracketCanvas({
  rounds, slots, teams, onFillSide, onRenameSlot, onCreateSlot, onRemoveSlot, onCreateRound, onRenameRound, onRemoveRound, errorMessage,
}: BracketCanvasProps) {
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
  const [editingRoundId, setEditingRoundId] = useState<number | null>(null)
  const [roundDraft, setRoundDraft] = useState('')
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
