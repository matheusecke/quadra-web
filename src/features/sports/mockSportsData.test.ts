import { describe, expect, it } from 'vitest'
import {
  getAllMatches,
  getChampionshipById,
  getChampionships,
  getMatchDetailById,
  getMatchesByChampionship,
} from './mockSportsData'
import {
  aggregateTeamStats,
  calculatePeriodTotal,
  consolidatedStandings,
  getPeriodLabel,
  LEADER_STAT_ORDER,
} from './sportsUtils'

describe('sports mock championship data', () => {
  it('exposes a 16-team championship with four compact groups and round-of-16 bracket matches', () => {
    const championship = getChampionshipById('c7')

    expect(championship).toBeDefined()
    expect(championship?.teamIds).toHaveLength(16)
    expect(championship?.groups).toHaveLength(4)
    expect(championship?.groups.every((group) => group.standings.length === 4)).toBe(true)
    expect(championship?.bracket.map((round) => round.name)).toEqual([
      'Oitavas de final',
      'Quartas de final',
      'Semifinais',
      'Final',
    ])

    const matches = getMatchesByChampionship('c7')
    const matchIds = new Set(matches.map((match) => match.id))
    const roundOf16 = championship?.bracket[0]?.matches ?? []

    expect(roundOf16).toHaveLength(8)
    expect(roundOf16.every((match) => match.matchId && matchIds.has(match.matchId))).toBe(true)
  })

  it('keeps rankings and leader categories limited to the supported championship surface', () => {
    const championship = getChampionships().find((item) => item.id === 'c7')

    expect(championship).toBeDefined()
    expect(LEADER_STAT_ORDER).toEqual(['ppg', 'rpg', 'apg', 'stg', 'bpg'])
    expect(Object.keys(championship?.leaders ?? {})).toEqual(LEADER_STAT_ORDER)
    expect(consolidatedStandings(championship!)[0]).toMatchObject({
      teamId: 't9',
      wins: 3,
      pointsFor: 252,
    })
  })

  it('keeps authored bracket match references linked to existing matches', () => {
    const matchIds = new Set(getAllMatches().map((match) => match.id))
    const bracketRefs = getChampionships()
      .flatMap((championship) => championship.bracket)
      .flatMap((round) => round.matches)
      .map((match) => match.matchId)
      .filter((matchId): matchId is string => Boolean(matchId))

    expect(bracketRefs.length).toBeGreaterThan(0)
    expect(bracketRefs.every((matchId) => matchIds.has(matchId))).toBe(true)
  })

  it('exposes match details with dynamic overtime periods and consistent box-score totals', () => {
    const matches = getAllMatches()
    const overtimeMatch = getMatchDetailById('mot1')

    expect(matches).toHaveLength(39)
    expect(overtimeMatch).toMatchObject({
      homeTeamId: 't3',
      awayTeamId: 't2',
      homeScore: 94,
      awayScore: 91,
      phase: 'Quartas de final',
      status: 'FINISHED',
    })

    expect(overtimeMatch?.periodScores?.map(getPeriodLabel)).toEqual([
      '1Q',
      '2Q',
      '3Q',
      '4Q',
      'OT',
    ])
    expect(calculatePeriodTotal(overtimeMatch!.periodScores, 'home')).toBe(94)
    expect(calculatePeriodTotal(overtimeMatch!.periodScores, 'away')).toBe(91)

    const homeTotals = aggregateTeamStats(overtimeMatch!.homeStats.players)
    const awayTotals = aggregateTeamStats(overtimeMatch!.awayStats.players)

    expect(overtimeMatch?.homeStats.players).toHaveLength(7)
    expect(overtimeMatch?.awayStats.players).toHaveLength(7)
    expect(homeTotals.pts).toBe(overtimeMatch?.homeScore)
    expect(awayTotals.pts).toBe(overtimeMatch?.awayScore)
    expect(
      overtimeMatch?.homeStats.players.every(
        (player) => player.pts === 2 * player.fgm + player.tpm + player.ftm,
      ),
    ).toBe(true)
  })
})
