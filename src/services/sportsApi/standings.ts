import type { Match, MatchStatus, StandingRow, StandingsEnvelope } from '../../features/sports/types'

/**
 * Team ranking per FIBA Official Basketball Rules 2024, Appendix D.
 * See docs/superpowers/specs/2026-07-06-sports-db-structure-design.md §8.
 *
 * NOTE: deliberately not a sort comparator. Head-to-head (D.1.3) is intransitive, and
 * D.1.4 restarts the procedure for teams left tied — so this is a recursive partition,
 * not a total order.
 */

export interface StandingTeamInput {
  tournamentTeamId: number
  teamId: number
  /** display_name_snapshot. Also the stable A→Z fallback when a tie has no recorded draw. */
  name: string
  /** The draw the org admin recorded — FIBA's last criterion. Never computed. */
  tiebreakOrder: number | null
  /** Fingerprint of the block the draw was made for. A draw for another block is inert. */
  tiebreakBlockKey: string | null
}

const PENDING_STATUSES: MatchStatus[] = ['SCHEDULED', 'LIVE', 'POSTPONED']

interface Tally {
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  classificationPoints: number
}

const emptyTally = (): Tally => ({ played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, classificationPoints: 0 })

const diff = (t: Tally) => t.pointsFor - t.pointsAgainst

/** A match belongs to this table only when both of its teams do — a team removed from the
 *  group leaves fixtures behind, and they are no longer games of this classification. */
const isInScope = (m: Match, ids: Set<number>) => ids.has(m.homeTournamentTeamId) && ids.has(m.awayTournamentTeamId)

const isFinished = (m: Match, ids: Set<number>) =>
  m.status === 'FINISHED' && m.homeScore != null && m.awayScore != null && isInScope(m, ids)

/** Tallies only the finished matches played between the given teams. */
function tally(tournamentTeamIds: Set<number>, matches: Match[]): Map<number, Tally> {
  const table = new Map<number, Tally>([...tournamentTeamIds].map((id) => [id, emptyTally()]))

  for (const m of matches) {
    if (!isFinished(m, tournamentTeamIds)) continue

    const home = table.get(m.homeTournamentTeamId)!
    const away = table.get(m.awayTournamentTeamId)!
    home.played++
    away.played++
    home.pointsFor += m.homeScore!
    home.pointsAgainst += m.awayScore!
    away.pointsFor += m.awayScore!
    away.pointsAgainst += m.homeScore!

    const homeWon = m.homeScore! > m.awayScore!
    const winner = homeWon ? home : away
    const loser = homeWon ? away : home
    const loserLossType = homeWon ? m.awayLossType : m.homeLossType

    winner.wins++
    winner.classificationPoints += 2
    loser.losses++
    loser.classificationPoints += loserLossType === 'FORFEIT' ? 0 : 1 // D.1.1
  }
  return table
}

/** Splits ids into blocks of equal key, highest key first. */
function partition(ids: number[], key: (id: number) => number): number[][] {
  const blocks: number[][] = []
  for (const id of [...ids].sort((a, b) => key(b) - key(a))) {
    const last = blocks.at(-1)
    if (last && key(last[0]) === key(id)) last.push(id)
    else blocks.push([id])
  }
  return blocks
}

export function computeStandings(
  teams: StandingTeamInput[],
  matches: Match[],
  group: { id: number; name: string } | null = null,
): StandingsEnvelope {
  const byId = new Map(teams.map((t) => [t.tournamentTeamId, t]))
  const allIds = new Set(byId.keys())

  const pendingMatches = matches.filter((m) => PENDING_STATUSES.includes(m.status) && isInScope(m, allIds)).length
  const finishedCount = matches.filter((m) => isFinished(m, allIds)).length
  const standingsState = finishedCount === 0 ? 'EMPTY' : pendingMatches > 0 ? 'PARTIAL' : 'FINAL'

  const byName = (a: StandingTeamInput, b: StandingTeamInput) =>
    a.name.localeCompare(b.name) || a.tournamentTeamId - b.tournamentTeamId

  // EMPTY is not a classification — it is the list of teams, zeroed. Ranking it would put a
  // "1st place" on a team that has won nothing, and would mark every team as tied.
  if (standingsState === 'EMPTY') {
    return {
      group,
      standingsState,
      pendingMatches,
      rows: [...teams].sort(byName).map((t) => ({
        position: null,
        tournamentTeamId: t.tournamentTeamId,
        teamId: t.teamId,
        teamName: t.name,
        played: 0, wins: 0, losses: 0,
        classificationPoints: 0,
        pointsFor: 0, pointsAgainst: 0, pointDiff: 0,
        winPct: null,
        isTiedUnresolved: false,
        tieBlockKey: null,
      })),
    }
  }

  const overall = tally(allIds, matches)
  const tieBlocks = new Map<number, string>() // teamId → block key (resolved or not)
  const unresolved = new Set<number>()

  /** The block's fingerprint: its tournamentTeamIds, sorted, joined. §8.8 */
  const blockKeyOf = (ids: number[]) => ids.sort((a, b) => a - b).join('-')

  /** D.1.3 + D.1.4 — restarted from the top for every block left tied. */
  function breakTie(tied: number[]): number[] {
    const headToHead = tally(new Set(tied), matches)

    const criteria: ((id: number) => number)[] = [
      (id) => headToHead.get(id)!.classificationPoints, // games between them
      (id) => diff(headToHead.get(id)!),
      (id) => headToHead.get(id)!.pointsFor,
      (id) => diff(overall.get(id)!), // then all games in the group
      (id) => overall.get(id)!.pointsFor,
    ]

    for (const key of criteria) {
      const blocks = partition(tied, key)
      if (blocks.length === 1) continue // this criterion split nothing; try the next
      // D.1.4: whoever is still tied goes through the whole procedure again, with
      // head-to-head recomputed among just the survivors.
      return blocks.flatMap((block) => (block.length === 1 ? block : breakTie(block)))
    }

    // Every criterion exhausted: the draw decides (§8.3). It is only honoured when it was
    // recorded FOR THIS BLOCK — a draw for a block that no longer exists stays written but
    // inert, so it can never hand a team an advantage inherited from a different tie.
    const key = blockKeyOf(tied)
    const honoured = tied.every((id) => {
      const t = byId.get(id)!
      return t.tiebreakOrder != null && t.tiebreakBlockKey === key
    })

    tied.forEach((id) => {
      tieBlocks.set(id, key)
      if (!honoured) unresolved.add(id)
    })

    return [...tied].sort((a, b) => {
      const [ta, tb] = [byId.get(a)!, byId.get(b)!]
      // Without a draw, keep a stable order so the table does not shuffle between requests.
      return honoured ? ta.tiebreakOrder! - tb.tiebreakOrder! : byName(ta, tb)
    })
  }

  const ranked = partition([...allIds], (id) => overall.get(id)!.classificationPoints).flatMap((block) =>
    block.length === 1 ? block : breakTie(block),
  )

  const rows: StandingRow[] = ranked.map((tournamentTeamId, i) => {
    const t = overall.get(tournamentTeamId)!
    const team = byId.get(tournamentTeamId)!
    return {
      position: i + 1,
      tournamentTeamId,
      teamId: team.teamId,
      teamName: team.name,
      played: t.played,
      wins: t.wins,
      losses: t.losses,
      classificationPoints: t.classificationPoints,
      pointsFor: t.pointsFor,
      pointsAgainst: t.pointsAgainst,
      pointDiff: diff(t),
      winPct: t.played === 0 ? null : t.wins / t.played,
      isTiedUnresolved: unresolved.has(tournamentTeamId),
      tieBlockKey: tieBlocks.get(tournamentTeamId) ?? null,
    }
  })

  return { group, standingsState, pendingMatches, rows }
}
