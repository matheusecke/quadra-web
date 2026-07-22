import { describe, expect, it } from 'vitest'

import { bracketLayout } from './bracketLayout'
import type { LayoutRound, LayoutSlot } from './bracketLayout'

const rounds = (count: number): LayoutRound[] =>
  Array.from({ length: count }, (_, index) => ({ id: index + 1, number: index + 1 }))

const slot = (over: Partial<LayoutSlot> & Pick<LayoutSlot, 'id' | 'roundId' | 'position'>): LayoutSlot => ({
  homeTournamentTeamId: null,
  awayTournamentTeamId: null,
  winnerTournamentTeamId: null,
  ...over,
})

// Teams A..H → 1..8; slot ids q1..q4/s1..s2/f1 → 11..17 (arbitrary, stable within this file).
/** Quartas → semis → final, 2ⁿ, com todos os vencedores declarados e colocados. */
const fullTree = (): LayoutSlot[] => [
  slot({ id: 11, roundId: 1, position: 1, homeTournamentTeamId: 1, awayTournamentTeamId: 2, winnerTournamentTeamId: 1 }),
  slot({ id: 12, roundId: 1, position: 2, homeTournamentTeamId: 3, awayTournamentTeamId: 4, winnerTournamentTeamId: 3 }),
  slot({ id: 13, roundId: 1, position: 3, homeTournamentTeamId: 5, awayTournamentTeamId: 6, winnerTournamentTeamId: 5 }),
  slot({ id: 14, roundId: 1, position: 4, homeTournamentTeamId: 7, awayTournamentTeamId: 8, winnerTournamentTeamId: 7 }),
  slot({ id: 15, roundId: 2, position: 1, homeTournamentTeamId: 1, awayTournamentTeamId: 3, winnerTournamentTeamId: 1 }),
  slot({ id: 16, roundId: 2, position: 2, homeTournamentTeamId: 5, awayTournamentTeamId: 7, winnerTournamentTeamId: 5 }),
  slot({ id: 17, roundId: 3, position: 1, homeTournamentTeamId: 1, awayTournamentTeamId: 5, winnerTournamentTeamId: 1 }),
]

describe('bracketLayout mode', () => {
  it('draws a tree for a 2ⁿ chain with no contradicting edge', () => {
    expect(bracketLayout(rounds(3), fullTree()).mode).toBe('tree')
  })

  it('falls back to columns when a round count is irregular', () => {
    const slots = [...fullTree(), slot({ id: 18, roundId: 2, position: 3 })]
    expect(bracketLayout(rounds(3), slots).mode).toBe('column')
  })

  it('falls back to columns when a declared winner appears outside the ceil(p/2) slot', () => {
    const slots = fullTree().map((entry) => (entry.id === 15 ? { ...entry, awayTournamentTeamId: 7 } : entry))
    expect(bracketLayout(rounds(3), slots).mode).toBe('column')
  })

  it('draws a tree for a 2ⁿ chain with no winner declared yet', () => {
    const slots = fullTree().map((entry) => ({ ...entry, winnerTournamentTeamId: null }))
    expect(bracketLayout(rounds(3), slots).mode).toBe('tree')
  })

  it('falls back to columns for a third-place playoff beside the final', () => {
    const slots = [...fullTree(), slot({ id: 19, roundId: 3, position: 2 })]
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
    const slots = fullTree().map((entry) => (entry.id === 17 ? { ...entry, homeTournamentTeamId: null } : entry))
    expect(bracketLayout(rounds(3), slots).edges).toHaveLength(5)
  })

  it('draws no edge at all before any winner is declared', () => {
    const slots = fullTree().map((entry) => ({ ...entry, winnerTournamentTeamId: null }))
    expect(bracketLayout(rounds(3), slots).edges).toEqual([])
  })

  it('sends the odd sibling down toward the pair midline', () => {
    const edge = bracketLayout(rounds(3), fullTree()).edges.find((entry) => entry.fromSlotId === 11)
    expect(edge?.direction).toBe('down')
  })

  it('sends the even sibling up toward the pair midline', () => {
    const edge = bracketLayout(rounds(3), fullTree()).edges.find((entry) => entry.fromSlotId === 12)
    expect(edge?.direction).toBe('up')
  })

  it('draws no edge in column mode', () => {
    const slots = [...fullTree(), slot({ id: 18, roundId: 2, position: 3 })]
    expect(bracketLayout(rounds(3), slots).edges).toEqual([])
  })

  it('keeps the bye chain closed, deriving an edge from a one-sided slot', () => {
    const slots = fullTree().map((entry) => (entry.id === 11 ? { ...entry, awayTournamentTeamId: null } : entry))
    expect(bracketLayout(rounds(3), slots).edges).toHaveLength(6)
  })
})
