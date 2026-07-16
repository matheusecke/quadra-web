import { describe, expect, it } from 'vitest'

import { bracketLayout } from './bracketLayout'
import type { LayoutRound, LayoutSlot } from './bracketLayout'

const rounds = (count: number): LayoutRound[] =>
  Array.from({ length: count }, (_, index) => ({ id: `r${index + 1}`, number: index + 1 }))

const slot = (over: Partial<LayoutSlot> & Pick<LayoutSlot, 'id' | 'roundId' | 'position'>): LayoutSlot => ({
  homeTournamentTeamId: null,
  awayTournamentTeamId: null,
  winnerTournamentTeamId: null,
  ...over,
})

/** Quartas → semis → final, 2ⁿ, com todos os vencedores declarados e colocados. */
const fullTree = (): LayoutSlot[] => [
  slot({ id: 'q1', roundId: 'r1', position: 1, homeTournamentTeamId: 'A', awayTournamentTeamId: 'B', winnerTournamentTeamId: 'A' }),
  slot({ id: 'q2', roundId: 'r1', position: 2, homeTournamentTeamId: 'C', awayTournamentTeamId: 'D', winnerTournamentTeamId: 'C' }),
  slot({ id: 'q3', roundId: 'r1', position: 3, homeTournamentTeamId: 'E', awayTournamentTeamId: 'F', winnerTournamentTeamId: 'E' }),
  slot({ id: 'q4', roundId: 'r1', position: 4, homeTournamentTeamId: 'G', awayTournamentTeamId: 'H', winnerTournamentTeamId: 'G' }),
  slot({ id: 's1', roundId: 'r2', position: 1, homeTournamentTeamId: 'A', awayTournamentTeamId: 'C', winnerTournamentTeamId: 'A' }),
  slot({ id: 's2', roundId: 'r2', position: 2, homeTournamentTeamId: 'E', awayTournamentTeamId: 'G', winnerTournamentTeamId: 'E' }),
  slot({ id: 'f1', roundId: 'r3', position: 1, homeTournamentTeamId: 'A', awayTournamentTeamId: 'E', winnerTournamentTeamId: 'A' }),
]

describe('bracketLayout mode', () => {
  it('draws a tree for a 2ⁿ chain with no contradicting edge', () => {
    expect(bracketLayout(rounds(3), fullTree()).mode).toBe('tree')
  })

  it('falls back to columns when a round count is irregular', () => {
    const slots = [...fullTree(), slot({ id: 's3', roundId: 'r2', position: 3 })]
    expect(bracketLayout(rounds(3), slots).mode).toBe('column')
  })

  it('falls back to columns when a declared winner appears outside the ceil(p/2) slot', () => {
    const slots = fullTree().map((entry) => (entry.id === 's1' ? { ...entry, awayTournamentTeamId: 'G' } : entry))
    expect(bracketLayout(rounds(3), slots).mode).toBe('column')
  })

  it('draws a tree for a 2ⁿ chain with no winner declared yet', () => {
    const slots = fullTree().map((entry) => ({ ...entry, winnerTournamentTeamId: null }))
    expect(bracketLayout(rounds(3), slots).mode).toBe('tree')
  })

  it('falls back to columns for a third-place playoff beside the final', () => {
    const slots = [...fullTree(), slot({ id: 'f2', roundId: 'r3', position: 2 })]
    expect(bracketLayout(rounds(3), slots).mode).toBe('column')
  })

  it('falls back to columns when there is no round at all', () => {
    expect(bracketLayout([], []).mode).toBe('column')
  })
})

describe('bracketLayout edges', () => {
  it('derives one edge per real winner continuity', () => {
    expect(bracketLayout(rounds(3), fullTree()).edges).toHaveLength(6)
  })

  it('draws no edge for a winner not yet placed in the next round', () => {
    const slots = fullTree().map((entry) => (entry.id === 'f1' ? { ...entry, homeTournamentTeamId: null } : entry))
    expect(bracketLayout(rounds(3), slots).edges).toHaveLength(5)
  })

  it('draws no edge at all before any winner is declared', () => {
    const slots = fullTree().map((entry) => ({ ...entry, winnerTournamentTeamId: null }))
    expect(bracketLayout(rounds(3), slots).edges).toEqual([])
  })

  it('sends the odd sibling down toward the pair midline', () => {
    const edge = bracketLayout(rounds(3), fullTree()).edges.find((entry) => entry.fromSlotId === 'q1')
    expect(edge?.direction).toBe('down')
  })

  it('sends the even sibling up toward the pair midline', () => {
    const edge = bracketLayout(rounds(3), fullTree()).edges.find((entry) => entry.fromSlotId === 'q2')
    expect(edge?.direction).toBe('up')
  })

  it('draws no edge in column mode', () => {
    const slots = [...fullTree(), slot({ id: 's3', roundId: 'r2', position: 3 })]
    expect(bracketLayout(rounds(3), slots).edges).toEqual([])
  })

  it('keeps the bye chain closed, deriving an edge from a one-sided slot', () => {
    const slots = fullTree().map((entry) => (entry.id === 'q1' ? { ...entry, awayTournamentTeamId: null } : entry))
    expect(bracketLayout(rounds(3), slots).edges).toHaveLength(6)
  })
})
