import { Trophy } from 'lucide-react'

import { cn } from '../../../components/ui/cn'
import { bracketLayout } from '../bracketLayout'
import { roundDisplayName, slotDisplayName } from '../sportsUtils'

import type { BracketRound, BracketSlotView } from '../types'
import s from './BracketBoard.module.css'

export interface BracketBoardProps {
  rounds: BracketRound[]
  slots: BracketSlotView[]
  championTournamentTeamId?: number | null
  variant?: 'compact' | 'full'
}

export function BracketBoard({ rounds, slots, championTournamentTeamId = null, variant = 'compact' }: BracketBoardProps) {
  const { mode, edges } = bracketLayout(rounds, slots.map((slot) => ({
    id: slot.id,
    roundId: slot.roundId,
    position: slot.position,
    homeTournamentTeamId: slot.homeTeam?.tournamentTeamId ?? null,
    awayTournamentTeamId: slot.awayTeam?.tournamentTeamId ?? null,
    winnerTournamentTeamId: slot.winnerTournamentTeamId,
  })))
  const slotsOf = (roundId: number) => slots.filter((slot) => slot.roundId === roundId)
  const edgeOut = (slotId: number) => edges.find((edge) => edge.fromSlotId === slotId) ?? null
  const hasEdgeIn = (slotId: number) => edges.some((edge) => edge.toSlotId === slotId)

  const renderSide = (slot: BracketSlotView, side: 'home' | 'away') => {
    const team = side === 'home' ? slot.homeTeam : slot.awayTeam
    const otherSide = side === 'home' ? slot.awayTeam : slot.homeTeam
    if (!team) return <div className={s.side}><span className={s.empty}>{otherSide ? 'bye' : 'a definir'}</span></div>
    const isWinner = team.tournamentTeamId === slot.winnerTournamentTeamId
    return <div className={cn(s.side, isWinner && s.sideWinner)}>
      <span className={s.tag}>{team.shortName}</span>
      <span className={s.name}>{team.name}</span>
      {team.tournamentTeamId === championTournamentTeamId && <><Trophy size={12} strokeWidth={1.8} className={s.trophy} aria-hidden="true" /><span className={s.srOnly}>Campeão</span></>}
      {isWinner && <span className={s.srOnly}>Vencedor</span>}
    </div>
  }

  const renderCard = (slot: BracketSlotView, round: BracketRound) => (
    <article className={s.cardWrap} aria-label={slotDisplayName(slot, round)} key={slot.id}>
      <div className={s.card}>{renderSide(slot, 'home')}{renderSide(slot, 'away')}</div>
    </article>
  )

  return <div className={cn(s.board, variant === 'full' && s.full)}>
    <div className={s.headerRow}>
      {rounds.map((round) => <div className={s.headerCell} key={round.id}>{roundDisplayName(round)}</div>)}
    </div>
    <div className={s.columns}>
      {rounds.map((round) => (
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
