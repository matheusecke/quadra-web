import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { BracketBoard } from './BracketBoard'
import type { BracketRound } from '../../../services/sportsApi/store'
import type { BracketSlotView } from '../useBracketView'

const rounds: BracketRound[] = [
  { id: 'r1', tournamentId: 't1', number: 1, label: 'Semifinais' },
  { id: 'r2', tournamentId: 't1', number: 2, label: 'Final' },
]

const teams = [
  { tournamentTeamId: 'tt-A', name: 'Alfa', shortName: 'T01' },
  { tournamentTeamId: 'tt-B', name: 'Beta', shortName: 'T02' },
  { tournamentTeamId: 'tt-C', name: 'Gama', shortName: 'T03' },
  { tournamentTeamId: 'tt-D', name: 'Delta', shortName: 'T04' },
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
  slot({ id: 's1', roundId: 'r1', position: 1, homeTournamentTeamId: 'tt-A', awayTournamentTeamId: 'tt-B', winnerTournamentTeamId: 'tt-A' }),
  slot({ id: 's2', roundId: 'r1', position: 2, homeTournamentTeamId: 'tt-C', awayTournamentTeamId: 'tt-D', winnerTournamentTeamId: 'tt-C' }),
  slot({ id: 'f1', roundId: 'r2', position: 1, homeTournamentTeamId: 'tt-A', awayTournamentTeamId: 'tt-C', winnerTournamentTeamId: 'tt-A' }),
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
    renderBoard({ rounds: [{ id: 'r1', tournamentId: 't1', number: 1, label: null }], slots: [slot({ id: 's1', roundId: 'r1', position: 1 })] })
    expect(screen.getByText('Rodada 1')).toBeInTheDocument()
  })

  it('renders every card in tree mode', () => {
    renderBoard()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('renders every card in column mode too', () => {
    renderBoard({ slots: [...tree(), slot({ id: 'f2', roundId: 'r2', position: 2 })] })
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
    renderBoard({ slots: [slot({ id: 's1', roundId: 'r1', position: 1, homeTournamentTeamId: 'tt-A' })] })
    expect(screen.getByText('bye')).toBeInTheDocument()
  })

  it('calls an empty side undefined when neither side is filled', () => {
    renderBoard({ slots: [slot({ id: 's1', roundId: 'r1', position: 1 })] })
    expect(screen.getAllByText('a definir')).toHaveLength(2)
  })

  it('links a card that has a match to the match page', () => {
    renderBoard({ slots: [slot({ id: 's1', roundId: 'r1', position: 1, matchId: 'm1', match: { id: 'm1', status: 'FINISHED', date: '2026-05-01T20:00:00.000Z', homeScore: 80, awayScore: 70 } })] })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/matches/m1')
  })

  it('does not link a card without a match', () => {
    renderBoard()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('marks the declared champion', () => {
    renderBoard({ championTournamentTeamId: 'tt-A' })
    expect(screen.getAllByText('Campeão')).toHaveLength(2)
  })

  // tree() has tt-A winning the final. No declaration, no trophy — the mark
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
