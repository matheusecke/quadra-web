import { describe, expect, it } from 'vitest'
import {
  getAllMatches,
  getChampionshipById,
  getChampionships,
  getMatchDetailById,
  getMatchesByChampionship,
  MOCK_TEAMS,
} from './mockSportsData'
import { calculatePeriodTotal, getPeriodLabel } from './sportsUtils'

describe('PUC sports mock data', () => {
  it('exposes exactly 2 championships', () => {
    expect(getChampionships()).toHaveLength(2)
  })

  it('Geral has 16 teams, 4 groups, 31 finished matches, Time 1 champion', () => {
    const c = getChampionshipById('puc-geral-2026')
    expect(c?.teamIds).toHaveLength(16)
    expect(c?.groups).toHaveLength(4)
    expect(c?.status).toBe('FINISHED')
    expect(c?.championTeamId).toBe('puc-time-1')
    const matches = getMatchesByChampionship('puc-geral-2026')
    expect(matches).toHaveLength(31)
    expect(matches.every((m) => m.status === 'FINISHED')).toBe(true)
  })

  it('Geral final is OT with consistent box score', () => {
    const final = getMatchesByChampionship('puc-geral-2026').find((m) => m.phase === 'Final')
    expect(final?.homeTeamId).toBe('puc-time-1')
    expect(final?.awayTeamId).toBe('puc-time-2')
    const detail = getMatchDetailById(final!.id)
    expect(detail?.periodScores?.map(getPeriodLabel)).toContain('OT')
    expect(calculatePeriodTotal(detail!.periodScores, 'home')).toBe(detail?.homeScore)
  })

  it('Inverno has only scheduled matches with pending stats', () => {
    const matches = getMatchesByChampionship('puc-inverno-2026')
    expect(matches).toHaveLength(15)
    expect(matches.every((m) => m.status === 'SCHEDULED')).toBe(true)
    expect(matches.every((m) => m.statsStatus === 'PENDING')).toBe(true)
  })

  it('all team IDs in matches exist in MOCK_TEAMS', () => {
    const teamIds = new Set(MOCK_TEAMS.map((t) => t.id))
    getAllMatches().forEach((m) => {
      expect(teamIds.has(m.homeTeamId)).toBe(true)
      expect(teamIds.has(m.awayTeamId)).toBe(true)
    })
  })
})
