import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { MatchStatus } from '../types'
import { formatDate, formatTime } from '../sportsUtils'
import { Button, Combobox, DateTimeField, Input } from '../../../components/ui'
import { cn } from '../../../components/ui/cn'
import s from './BracketCanvas.module.css'

export interface BracketTeamOption {
  tournamentTeamId: string
  name: string
  shortName: string
}

export interface BracketSlotView {
  id: string
  roundNumber: number
  position: number
  label: string | null
  homeTournamentTeamId: string | null
  awayTournamentTeamId: string | null
  matchId: string | null
  winnerTournamentTeamId: string | null
  match: { id: string; status: MatchStatus; date: string; homeScore: number | null; awayScore: number | null } | null
}

export interface BracketCanvasProps {
  slots: BracketSlotView[]
  teams: BracketTeamOption[]
  isOrgAdmin: boolean
  onFillSide: (slotId: string, side: 'home' | 'away', tournamentTeamId: string | null) => Promise<void>
  onSetWinner: (slotId: string, tournamentTeamId: string) => Promise<void>
  onRenameSlot: (slotId: string, label: string) => Promise<void>
  onSchedule: (slotId: string, scheduledAt: string) => Promise<void>
  onCreateSlot: (roundNumber: number) => Promise<void>
  onCreateRound: () => Promise<void>
  onRemoveSlot: (slotId: string) => Promise<void>
  errorMessage?: string
}

export function BracketCanvas({ slots, teams, isOrgAdmin, onFillSide, onSetWinner, onRenameSlot, onSchedule, onCreateSlot, onCreateRound, onRemoveSlot, errorMessage }: BracketCanvasProps) {
  const [scheduleSlotId, setScheduleSlotId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
  const rounds = [...new Set(slots.map((slot) => slot.roundNumber))].sort((a, b) => a - b)
  const slotsOf = (roundNumber: number) => slots.filter((slot) => slot.roundNumber === roundNumber).sort((a, b) => a.position - b.position)
  const nameOf = (id: string | null) => teams.find((team) => team.tournamentTeamId === id)?.name ?? null

  const renderSide = (slot: BracketSlotView, side: 'home' | 'away') => {
    const teamId = side === 'home' ? slot.homeTournamentTeamId : slot.awayTournamentTeamId
    const otherSide = side === 'home' ? slot.awayTournamentTeamId : slot.homeTournamentTeamId
    const score = slot.match ? (side === 'home' ? slot.match.homeScore : slot.match.awayScore) : null
    const label = slot.label ?? `Vaga ${slot.position}`
    if (!teamId) {
      if (!isOrgAdmin) return <span className={s.tbd}>{otherSide ? 'bye' : 'a definir'}</span>
      return <Combobox aria-label={`${label} — ${side === 'home' ? 'mandante' : 'visitante'}`} placeholder={otherSide ? '+ escolher equipe (bye)' : '+ escolher equipe'} options={teams.map((team) => ({ value: team.tournamentTeamId, label: team.name, secondary: team.shortName }))} value={null} onChange={(value) => { void onFillSide(slot.id, side, value || null) }} />
    }
    const name = nameOf(teamId) ?? teamId
    const isWinner = teamId === slot.winnerTournamentTeamId
    return <div className={cn(s.side, isWinner && s.sideWinner)}>
      {isOrgAdmin ? <button type="button" className={s.sideName} aria-label={`Definir ${name} como vencedora`} onClick={() => { void onSetWinner(slot.id, teamId) }}>{name}</button> : <span className={s.sideName}>{name}</span>}
      {score !== null && <span className={s.sideScore}>{score}</span>}
      {isWinner && <span className={s.winnerTag}>✓ Vencedor</span>}
    </div>
  }

  const renderFooter = (slot: BracketSlotView) => {
    if (slot.match) {
      if (slot.match.status === 'FINISHED') return null
      return <div className={s.footer}><span>{formatDate(slot.match.date)} · {formatTime(slot.match.date)}</span><Link to={`/matches/${slot.match.id}/sumula`}>Lançar súmula</Link></div>
    }
    const isFull = slot.homeTournamentTeamId !== null && slot.awayTournamentTeamId !== null
    if (!isFull) return <span className={s.hint}>avança sem jogo</span>
    if (!isOrgAdmin) return null
    if (scheduleSlotId !== slot.id) return <Button size="sm" onClick={() => setScheduleSlotId(slot.id)}>Agendar</Button>
    return <div className={s.scheduler}><DateTimeField type="datetime-local" aria-label="Data e hora" value={draft} onChange={setDraft} /><Button size="sm" onClick={() => { void onSchedule(slot.id, draft); setScheduleSlotId(null); setDraft('') }}>Confirmar</Button></div>
  }

  return <div>
    <div className={s.canvas}>
      {rounds.map((round) => {
        const roundSlots = slotsOf(round)
        return <div className={s.round} key={round}>
          <h3>{roundSlots.length === 1 && roundSlots[0].label ? roundSlots[0].label : `Rodada ${round}`}</h3>
          {roundSlots.map((slot) => {
            const label = slot.label ?? `Vaga ${slot.position}`
            const editing = editingSlotId === slot.id
            return <article className={s.slot} key={slot.id}>
              <div className={s.slotHeader}>{editing ? <Input aria-label="Nome da vaga" value={labelDraft} onChange={(event) => setLabelDraft(event.target.value)} onBlur={() => { void onRenameSlot(slot.id, labelDraft); setEditingSlotId(null) }} autoFocus /> : <button type="button" className={s.slotTitle} onClick={() => { if (isOrgAdmin) { setEditingSlotId(slot.id); setLabelDraft(label) } }}>{label}</button>}{isOrgAdmin && <button type="button" className={s.remove} aria-label={`Remover ${label}`} onClick={() => { void onRemoveSlot(slot.id) }}>×</button>}</div>
              {renderSide(slot, 'home')}
              {renderSide(slot, 'away')}
              {renderFooter(slot)}
            </article>
          })}
          {isOrgAdmin && <button type="button" className={s.ghostSlot} onClick={() => { void onCreateSlot(round) }}>+ Adicionar vaga</button>}
        </div>
      })}
      {isOrgAdmin && <button type="button" className={s.ghostRound} onClick={() => { void onCreateRound() }}>+ Nova rodada</button>}
    </div>
    {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
  </div>
}
