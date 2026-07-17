import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '../../../components/ui/cn'
import { bracketLayout } from '../bracketLayout'
import { roundDisplayName, slotDisplayName } from '../sportsUtils'

import type { BracketRound } from '../types'
import type { BracketSlotView, BracketTeamOption } from '../useBracketView'
import s from './BracketBoard.module.css'

export interface BracketBoardProps {
  rounds: BracketRound[]
  slots: BracketSlotView[]
  teams: BracketTeamOption[]
  championTournamentTeamId?: string | null
  variant?: 'compact' | 'full'
}

export function BracketBoard({ rounds, slots, teams, championTournamentTeamId = null, variant = 'compact' }: BracketBoardProps) {
  const ordered = [...rounds].sort((a, b) => a.number - b.number)
  const { mode, edges } = bracketLayout(ordered, slots)
  const slotsOf = (roundId: string) => slots.filter((slot) => slot.roundId === roundId).sort((a, b) => a.position - b.position)
  const teamOf = (id: string | null) => teams.find((team) => team.tournamentTeamId === id) ?? null
  const edgeOut = (slotId: string) => edges.find((edge) => edge.fromSlotId === slotId) ?? null
  const hasEdgeIn = (slotId: string) => edges.some((edge) => edge.toSlotId === slotId)

  const renderSide = (slot: BracketSlotView, side: 'home' | 'away') => {
    const teamId = side === 'home' ? slot.homeTournamentTeamId : slot.awayTournamentTeamId
    const otherSide = side === 'home' ? slot.awayTournamentTeamId : slot.homeTournamentTeamId
    if (!teamId) return <div className={s.side}><span className={s.empty}>{otherSide ? 'bye' : 'a definir'}</span></div>
    const team = teamOf(teamId)
    const score = slot.match ? (side === 'home' ? slot.match.homeScore : slot.match.awayScore) : null
    const isWinner = teamId === slot.winnerTournamentTeamId
    return <div className={cn(s.side, isWinner && s.sideWinner)}>
      <span className={s.tag}>{team?.shortName ?? '—'}</span>
      <span className={s.name}>{team?.name ?? teamId}</span>
      {teamId === championTournamentTeamId && <><Trophy size={12} strokeWidth={1.8} className={s.trophy} aria-hidden="true" /><span className={s.srOnly}>Campeão</span></>}
      {score !== null && <span className={s.score}>{score}</span>}
      {isWinner && <span className={s.srOnly}>Vencedor</span>}
    </div>
  }

  const renderCard = (slot: BracketSlotView, round: BracketRound) => {
    const inner = <>{renderSide(slot, 'home')}{renderSide(slot, 'away')}</>
    return <article className={s.cardWrap} aria-label={slotDisplayName(slot, round)} key={slot.id}>
      {slot.matchId
        ? <Link to={`/matches/${slot.matchId}`} className={s.card}>{inner}</Link>
        : <div className={s.card}>{inner}</div>}
    </article>
  }

  return <div className={cn(s.board, variant === 'full' && s.full)}>
    <div className={s.headerRow}>
      {ordered.map((round) => <div className={s.headerCell} key={round.id}>{roundDisplayName(round)}</div>)}
    </div>
    <div className={s.columns}>
      {ordered.map((round) => (
        <div className={s.column} key={round.id}>
          {mode === 'tree' ? (
            <div className={s.treeStack}>
              {slotsOf(round.id).map((slot) => {
                const out = edgeOut(slot.id)
                return <div key={slot.id} className={cn(s.treeCell, out?.direction === 'down' && s.edgeDown, out?.direction === 'up' && s.edgeUp, hasEdgeIn(slot.id) && s.edgeIn)}>
                  {renderCard(slot, round)}
                </div>
              })}
            </div>
          ) : (
            <div className={s.columnStack}>{slotsOf(round.id).map((slot) => renderCard(slot, round))}</div>
          )}
        </div>
      ))}
    </div>
  </div>
}
