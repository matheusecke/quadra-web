import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { BracketBoard } from './BracketBoard'
import type { BracketRound } from '../types'
import type { BracketSlotView } from '../useBracketView'

const rounds: BracketRound[] = [
  { id: 1, tournamentId: 1, number: 1, label: 'Semifinais' },
  { id: 2, tournamentId: 1, number: 2, label: 'Final' },
]

const teams = [
  { tournamentTeamId: 1, name: 'Alfa', shortName: 'T01' },
  { tournamentTeamId: 2, name: 'Beta', shortName: 'T02' },
  { tournamentTeamId: 3, name: 'Gama', shortName: 'T03' },
  { tournamentTeamId: 4, name: 'Delta', shortName: 'T04' },
]

const slot = (over: Partial<BracketSlotView> & Pick<BracketSlotView, 'id' | 'roundId' | 'position'>): BracketSlotView => ({
  label: null,
  homeTournamentTeamId: null,
  awayTournamentTeamId: null,
  matchId: null,
  winnerTournamentTeamId: null,
  match: null,
  ...over,
})

const tree = (): BracketSlotView[] => [
  slot({ id: 11, roundId: 1, position: 1, homeTournamentTeamId: 1, awayTournamentTeamId: 2, winnerTournamentTeamId: 1 }),
  slot({ id: 12, roundId: 1, position: 2, homeTournamentTeamId: 3, awayTournamentTeamId: 4, winnerTournamentTeamId: 3 }),
  slot({ id: 13, roundId: 2, position: 1, homeTournamentTeamId: 1, awayTournamentTeamId: 3, winnerTournamentTeamId: 1 }),
]

const renderBoard = (props: Partial<Parameters<typeof BracketBoard>[0]> = {}) =>
  render(
    <MemoryRouter>
      <BracketBoard rounds={rounds} slots={tree()} teams={teams} {...props} />
    </MemoryRouter>,
  )

describe('BracketBoard', () => {
  it('labels each round on the header row', () => {
    renderBoard()
    expect(screen.getByText('Semifinais')).toBeInTheDocument()
  })

  it('falls back to the round number when the round has no label', () => {
    renderBoard({ rounds: [{ id: 1, tournamentId: 1, number: 1, label: null }], slots: [slot({ id: 11, roundId: 1, position: 1 })] })
    expect(screen.getByText('Rodada 1')).toBeInTheDocument()
  })

  it('renders every card in tree mode', () => {
    renderBoard()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('renders every card in column mode too', () => {
    renderBoard({ slots: [...tree(), slot({ id: 14, roundId: 2, position: 2 })] })
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('orders the cards by position, not by which winners are declared', () => {
    renderBoard({ slots: tree().map((entry) => ({ ...entry, winnerTournamentTeamId: null })) })
    expect(screen.getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual(['Semifinais 1', 'Semifinais 2', 'Final 1'])
  })

  it('keeps that same order once the winners arrive', () => {
    renderBoard()
    expect(screen.getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual(['Semifinais 1', 'Semifinais 2', 'Final 1'])
  })

  // tree() declares three winners. The srOnly text is the non-colour indicator;
  // the 2px accent bar and the 600 weight are the visual ones.
  it('marks every winner with more than colour', () => {
    renderBoard()
    expect(screen.getAllByText('Vencedor')).toHaveLength(3)
  })

  it('calls an empty side a bye when the other side is filled', () => {
    renderBoard({ slots: [slot({ id: 11, roundId: 1, position: 1, homeTournamentTeamId: 1 })] })
    expect(screen.getByText('bye')).toBeInTheDocument()
  })

  it('calls an empty side undefined when neither side is filled', () => {
    renderBoard({ slots: [slot({ id: 11, roundId: 1, position: 1 })] })
    expect(screen.getAllByText('a definir')).toHaveLength(2)
  })

  it('links a card that has a match to the match page', () => {
    renderBoard({ slots: [slot({ id: 11, roundId: 1, position: 1, matchId: 101, match: { id: 101, status: 'FINISHED', date: '2026-05-01T20:00:00.000Z', homeScore: 80, awayScore: 70 } })] })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/matches/101')
  })

  it('does not link a card without a match', () => {
    renderBoard()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('marks the declared champion', () => {
    renderBoard({ championTournamentTeamId: 1 })
    expect(screen.getAllByText('Campeão')).toHaveLength(2)
  })

  // tree() has team 1 winning the final. No declaration, no trophy — the mark
  // comes from championTournamentTeamId, never from the last round (DB spec §5.4).
  it('marks no champion when none is declared, even for the winner of the last round', () => {
    renderBoard()
    expect(screen.queryByText('Campeão')).not.toBeInTheDocument()
  })

  it('renders no control that writes', () => {
    renderBoard()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
