import { describe, it, expect } from 'vitest'
import { computeStandings } from './standings'
import type { StandingTeamInput } from './standings'
import type { Match } from '../../features/sports/types'

const team = (teamId: string): StandingTeamInput => ({
  tournamentTeamId: `tt-${teamId}`, teamId, name: teamId, tiebreakOrder: null, tiebreakBlockKey: null,
})
const teams = (...ids: string[]) => ids.map(team)

let seq = 0
const played = (homeTeamId: string, homeScore: number, awayTeamId: string, awayScore: number, over: Partial<Match> = {}): Match => ({
  id: `m${seq++}`, tournamentId: 't', phase: '', date: '2026-02-01',
  homeTeamId, awayTeamId, homeScore, awayScore,
  status: 'FINISHED', statsStatus: 'COMPLETE',
  homeLossType: homeScore < awayScore ? 'NORMAL' : null,
  awayLossType: awayScore < homeScore ? 'NORMAL' : null,
  scoreSource: 'PERIODS',
  tournamentGroupId: null,
  ...over,
})
const scheduled = (homeTeamId: string, awayTeamId: string, over: Partial<Match> = {}): Match => ({
  id: `m${seq++}`, tournamentId: 't', phase: '', date: '2026-02-01',
  homeTeamId, awayTeamId, homeScore: null, awayScore: null,
  status: 'SCHEDULED', statsStatus: 'PENDING',
  homeLossType: null, awayLossType: null, scoreSource: null, tournamentGroupId: null,
  ...over,
})

const order = (rows: { teamId: string }[]) => rows.map((r) => r.teamId)

describe('computeStandings — FIBA Appendix D', () => {
  it('awards 2 points for a win and 1 for a loss (D.1.1)', () => {
    const { rows } = computeStandings(teams('A', 'B'), [played('A', 70, 'B', 60)])
    expect(rows.map((r) => r.classificationPoints)).toEqual([2, 1])
  })

  it('awards 0 points for a loss by forfeit (D.1.1)', () => {
    const wo = played('A', 20, 'B', 0, { awayLossType: 'FORFEIT', scoreSource: 'AWARDED' })
    const { rows } = computeStandings(teams('A', 'B'), [wo])
    expect(rows.find((r) => r.teamId === 'B')!.classificationPoints).toBe(0)
  })

  // The decisive case: B has a far better overall differential, but A won the
  // head-to-head. FIBA ranks A above B; a wins→differential comparator does not.
  it('breaks a tie by head-to-head before overall point differential (D.1.3)', () => {
    const { rows } = computeStandings(teams('A', 'B', 'C'), [
      played('A', 81, 'B', 80),   // A wins by 1
      played('C', 100, 'A', 70),  // A loses by 30 → overall diff -29
      played('C', 82, 'B', 80),   // B loses by 2  → overall diff  -3
    ])
    expect(order(rows)).toEqual(['C', 'A', 'B'])
  })

  // Appendix D, Example 6. Five teams tie at 3-2. Head-to-head among the five
  // resolves only 1st (C) and 2nd (A); the procedure then RESTARTS for B, D and E,
  // recomputing head-to-head among just those three → 3rd B, 4th E, 5th D.
  it('restarts the procedure for teams still tied after a partial break (D.1.4)', () => {
    const { rows } = computeStandings(teams('A', 'B', 'C', 'D', 'E', 'F'), [
      played('A', 71, 'B', 65), played('A', 85, 'C', 86), played('A', 77, 'D', 75),
      played('A', 80, 'E', 86), played('A', 85, 'F', 80), played('B', 88, 'C', 87),
      played('B', 80, 'D', 75), played('B', 75, 'E', 76), played('B', 95, 'F', 90),
      played('C', 95, 'D', 100), played('C', 82, 'E', 75), played('C', 105, 'F', 75),
      played('D', 68, 'E', 67), played('D', 65, 'F', 60), played('E', 80, 'F', 75),
    ])
    expect(order(rows)).toEqual(['C', 'A', 'B', 'E', 'D', 'F'])
  })

  it('flags an unresolved tie when every criterion is exhausted, sharing one block key', () => {
    const { rows } = computeStandings(teams('A', 'B'), [played('A', 80, 'B', 70), played('B', 80, 'A', 70)])
    expect(rows.every((r) => r.isTiedUnresolved)).toBe(true)
    expect(rows[0].tieBlockKey).toBe(rows[1].tieBlockKey)
    expect(rows[0].tieBlockKey).toBe('tt-A-tt-B')
  })

  it('honours a recorded draw whose block key still matches', () => {
    const withDraw: StandingTeamInput[] = [
      { ...team('A'), tiebreakOrder: 2, tiebreakBlockKey: 'tt-A-tt-B' },
      { ...team('B'), tiebreakOrder: 1, tiebreakBlockKey: 'tt-A-tt-B' },
    ]
    const { rows } = computeStandings(withDraw, [played('A', 80, 'B', 70), played('B', 80, 'A', 70)])
    expect(order(rows)).toEqual(['B', 'A'])
    expect(rows.every((r) => r.isTiedUnresolved)).toBe(false)
  })

  it('ignores a recorded draw whose block no longer exists — it never leaks into a different tie', () => {
    const stale: StandingTeamInput[] = [
      { ...team('A'), tiebreakOrder: 2, tiebreakBlockKey: 'tt-A-tt-B-tt-C' },
      { ...team('B'), tiebreakOrder: 1, tiebreakBlockKey: 'tt-A-tt-B-tt-C' },
    ]
    const { rows } = computeStandings(stale, [played('A', 80, 'B', 70), played('B', 80, 'A', 70)])
    expect(order(rows)).toEqual(['A', 'B'])          // stable fallback: name A→Z
    expect(rows.every((r) => r.isTiedUnresolved)).toBe(true)
  })

  it('is EMPTY with null positions and null winPct when nothing has been played', () => {
    const envelope = computeStandings(teams('B', 'A'), [scheduled('A', 'B')])
    expect(envelope.standingsState).toBe('EMPTY')
    expect(envelope.rows.map((r) => r.position)).toEqual([null, null])
    expect(order(envelope.rows)).toEqual(['A', 'B'])  // teamName A→Z
    expect(envelope.rows[0].winPct).toBeNull()
  })

  it('is PARTIAL while a match is still pending, and counts them', () => {
    const envelope = computeStandings(teams('A', 'B'), [played('A', 70, 'B', 60), scheduled('B', 'A')])
    expect(envelope.standingsState).toBe('PARTIAL')
    expect(envelope.pendingMatches).toBe(1)
  })

  it('is FINAL when the only unplayed match was cancelled — CANCELLED is not pending', () => {
    const envelope = computeStandings(teams('A', 'B'), [
      played('A', 70, 'B', 60),
      scheduled('B', 'A', { status: 'CANCELLED' }),
    ])
    expect(envelope.standingsState).toBe('FINAL')
    expect(envelope.pendingMatches).toBe(0)
  })
})
