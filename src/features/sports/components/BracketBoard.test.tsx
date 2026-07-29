import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { BracketBoard } from './BracketBoard'
import type { BracketRound, BracketSlotView } from '../types'

const rounds: BracketRound[] = [
  { id: 1, tournamentId: 1, number: 1, label: 'Semifinais' },
  { id: 2, tournamentId: 1, number: 2, label: 'Final' },
]

const team = (tournamentTeamId: number, name: string, shortName: string) => ({ tournamentTeamId, name, shortName })

const slot = (over: Partial<BracketSlotView> & Pick<BracketSlotView, 'id' | 'roundId' | 'position'>): BracketSlotView => ({
  label: null,
  homeTeam: null,
  awayTeam: null,
  winnerTournamentTeamId: null,
  ...over,
})

const tree = (): BracketSlotView[] => [
  slot({ id: 11, roundId: 1, position: 1, homeTeam: team(1, 'Alfa', 'T01'), awayTeam: team(2, 'Beta', 'T02'), winnerTournamentTeamId: 1 }),
  slot({ id: 12, roundId: 1, position: 2, homeTeam: team(3, 'Gama', 'T03'), awayTeam: team(4, 'Delta', 'T04'), winnerTournamentTeamId: 3 }),
  slot({ id: 13, roundId: 2, position: 1, homeTeam: team(1, 'Alfa', 'T01'), awayTeam: team(3, 'Gama', 'T03'), winnerTournamentTeamId: 1 }),
]

const renderBoard = (props: Partial<Parameters<typeof BracketBoard>[0]> = {}) =>
  render(
    <MemoryRouter>
      <BracketBoard rounds={rounds} slots={tree()} {...props} />
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
    renderBoard({ slots: [slot({ id: 11, roundId: 1, position: 1, homeTeam: team(1, 'Alfa', 'T01') })] })
    expect(screen.getByText('bye')).toBeInTheDocument()
  })

  it('calls an empty side undefined when neither side is filled', () => {
    renderBoard({ slots: [slot({ id: 11, roundId: 1, position: 1 })] })
    expect(screen.getAllByText('a definir')).toHaveLength(2)
  })

  it('renders the team names carried on the slot, with no lookup table', () => {
    render(
      <MemoryRouter>
        <BracketBoard rounds={rounds} slots={[slot({ id: 11, roundId: 1, position: 1, homeTeam: team(9, 'Engenharia', 'ENG'), awayTeam: null })]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Engenharia')).toBeInTheDocument()
    expect(screen.getByText('ENG')).toBeInTheDocument()
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
