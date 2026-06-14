import { describe, expect, it } from 'vitest'
import {
  getChampionshipById,
  getChampionships,
  getMatchesByChampionship,
} from './mockSportsData'
import { consolidatedStandings, LEADER_STAT_ORDER } from './sportsUtils'

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
})
