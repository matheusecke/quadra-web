export interface LayoutRound {
  id: number
  number: number
}

export interface LayoutSlot {
  id: number
  roundId: number
  position: number
  homeTournamentTeamId: number | null
  awayTournamentTeamId: number | null
  winnerTournamentTeamId: number | null
}

export interface BracketEdge {
  fromSlotId: number
  toSlotId: number
  /** Toward the midline of the sibling pair: the odd position goes down, the even goes up. */
  direction: 'up' | 'down'
}

export interface BracketLayout {
  mode: 'tree' | 'column'
  edges: BracketEdge[]
}

/**
 * Decides between the tree and the column fallback, and derives the edges.
 *
 * An edge exists only where a declared winner actually continues into the next
 * round — never inferred from position. The tree needs a 2ⁿ chain and no edge
 * contradicting the adjacent pairing; anything else degrades to columns with no
 * lines at all. See spec §5.
 */
export function bracketLayout(rounds: LayoutRound[], slots: LayoutSlot[]): BracketLayout {
  const ordered = [...rounds].sort((a, b) => a.number - b.number)
  if (ordered.length === 0) return { mode: 'column', edges: [] }

  const slotsOf = (roundId: number) => slots.filter((slot) => slot.roundId === roundId).sort((a, b) => a.position - b.position)
  const isPowerChain = ordered.every((round, index) => slotsOf(round.id).length === 2 ** (ordered.length - 1 - index))

  const edges: BracketEdge[] = []
  let isPairingHonest = true

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const next = slotsOf(ordered[index + 1].id)
    for (const slot of slotsOf(ordered[index].id)) {
      const winner = slot.winnerTournamentTeamId
      if (!winner) continue
      const target = next.find((entry) => entry.homeTournamentTeamId === winner || entry.awayTournamentTeamId === winner)
      if (!target) continue
      if (target.position !== Math.ceil(slot.position / 2)) isPairingHonest = false
      edges.push({ fromSlotId: slot.id, toSlotId: target.id, direction: slot.position % 2 === 1 ? 'down' : 'up' })
    }
  }

  const mode = isPowerChain && isPairingHonest ? 'tree' : 'column'
  return { mode, edges: mode === 'tree' ? edges : [] }
}
