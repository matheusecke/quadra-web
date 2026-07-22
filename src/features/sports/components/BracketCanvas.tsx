import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatTime, roundDisplayName, slotDisplayName } from '../sportsUtils'
import { Button, Combobox, DateTimeField, Input } from '../../../components/ui'
import { cn } from '../../../components/ui/cn'
import { parsePositiveId } from '../parsePositiveId'
import type { BracketRound } from '../types'
import type { BracketSlotView, BracketTeamOption } from '../useBracketView'
import s from './BracketCanvas.module.css'

export interface BracketCanvasProps {
  rounds: BracketRound[]
  slots: BracketSlotView[]
  teams: BracketTeamOption[]
  onFillSide: (slotId: number, side: 'home' | 'away', tournamentTeamId: number | null) => Promise<void>
  onSetWinner: (slotId: number, tournamentTeamId: number) => Promise<void>
  onRenameSlot: (slotId: number, label: string) => Promise<void>
  onSchedule: (slotId: number, scheduledAt: string) => Promise<void>
  onCreateSlot: (roundId: number) => Promise<void>
  onCreateRound: () => Promise<void>
  onRemoveSlot: (slotId: number) => Promise<void>
  errorMessage?: string
}

export function BracketCanvas({ rounds, slots, teams, onFillSide, onSetWinner, onRenameSlot, onSchedule, onCreateSlot, onCreateRound, onRemoveSlot, errorMessage }: BracketCanvasProps) {
  const [scheduleSlotId, setScheduleSlotId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
  const slotsOf = (roundId: number) => slots.filter((slot) => slot.roundId === roundId).sort((a, b) => a.position - b.position)
  const nameOf = (id: number | null) => teams.find((team) => team.tournamentTeamId === id)?.name ?? null
  const roundOf = (slot: BracketSlotView) => rounds.find((round) => round.id === slot.roundId) ?? { label: null }

  const renderSide = (slot: BracketSlotView, side: 'home' | 'away') => {
    const teamId = side === 'home' ? slot.homeTournamentTeamId : slot.awayTournamentTeamId
    const otherSide = side === 'home' ? slot.awayTournamentTeamId : slot.homeTournamentTeamId
    const score = slot.match ? (side === 'home' ? slot.match.homeScore : slot.match.awayScore) : null
    const label = slotDisplayName(slot, roundOf(slot))
    if (!teamId) {
      return <Combobox aria-label={`${label} — ${side === 'home' ? 'mandante' : 'visitante'}`} placeholder={otherSide ? '+ escolher equipe (bye)' : '+ escolher equipe'} options={teams.map((team) => ({ value: String(team.tournamentTeamId), label: team.name, secondary: team.shortName }))} value={null} onChange={(raw) => { void onFillSide(slot.id, side, parsePositiveId(raw)) }} />
    }
    const name = nameOf(teamId) ?? teamId
    const isWinner = teamId === slot.winnerTournamentTeamId
    return <div className={cn(s.side, isWinner && s.sideWinner)}>
      <button type="button" className={s.sideName} aria-label={`Definir ${name} como vencedora`} onClick={() => { void onSetWinner(slot.id, teamId) }}>{name}</button>
      {score !== null && <span className={s.sideScore}>{score}</span>}
      {isWinner && <span className={s.srOnly}>Vencedor</span>}
    </div>
  }

  const renderFooter = (slot: BracketSlotView) => {
    if (slot.match) {
      if (slot.match.status === 'FINISHED') return null
      return <div className={s.footer}><span>{formatDate(slot.match.date)} · {formatTime(slot.match.date)}</span><Link to={`/matches/${slot.match.id}/sumula`}>Lançar súmula</Link></div>
    }
    const isFull = slot.homeTournamentTeamId !== null && slot.awayTournamentTeamId !== null
    if (!isFull) return <span className={s.hint}>avança sem jogo</span>
    if (scheduleSlotId !== slot.id) return <Button size="sm" onClick={() => setScheduleSlotId(slot.id)}>Agendar</Button>
    return <div className={s.scheduler}><DateTimeField type="datetime-local" aria-label="Data e hora" value={draft} onChange={setDraft} /><Button size="sm" onClick={() => { void onSchedule(slot.id, draft); setScheduleSlotId(null); setDraft('') }}>Confirmar</Button></div>
  }

  return <div>
    <div className={s.canvas}>
      {rounds.map((round) => {
        const roundSlots = slotsOf(round.id)
        return <div className={s.round} key={round.id}>
          <h3>{roundDisplayName(round)}</h3>
          {roundSlots.map((slot) => {
            const label = slotDisplayName(slot, round)
            const editing = editingSlotId === slot.id
            return <article className={s.slot} key={slot.id}>
              <div className={s.slotHeader}>{editing ? <Input aria-label="Nome da vaga" value={labelDraft} onChange={(event) => setLabelDraft(event.target.value)} onBlur={() => { void onRenameSlot(slot.id, labelDraft); setEditingSlotId(null) }} autoFocus /> : <button type="button" className={s.slotTitle} onClick={() => { setEditingSlotId(slot.id); setLabelDraft(label) }}>{label}</button>}<button type="button" className={s.remove} aria-label={`Remover ${label}`} onClick={() => { void onRemoveSlot(slot.id) }}>×</button></div>
              {renderSide(slot, 'home')}
              {renderSide(slot, 'away')}
              {renderFooter(slot)}
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
