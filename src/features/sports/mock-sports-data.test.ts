import { describe, expect, it } from 'vitest'
import {
  getAllMatches,
  getMatchesByTournament,
  getTournamentById,
  getTournaments,
  MOCK_TEAMS,
  seedGroupMembership,
  seedMatches,
} from './mock-sports-data'
import { SEED_TOURNAMENT, tournamentTeamId } from './seedIds'

describe('seeded group membership', () => {
  it('puts every enrolled team of the demo tournaments in exactly one group', () => {
    const geral = seedGroupMembership.filter((g) => g.tournamentId === 1)
    const teamIds = geral.flatMap((g) => g.teamIds)
    expect(geral.map((g) => g.groupName)).toEqual(['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D'])
    expect(new Set(teamIds).size).toBe(16)
  })

  it('tags group-stage matches with their group and leaves knockout games ungrouped', () => {
    const geralMatches = seedMatches.filter((m) => m.tournamentId === 1)
    expect(geralMatches.filter((m) => m.tournamentGroupId !== null)).toHaveLength(24)
    expect(seedMatches.find((m) => m.id === 131)?.tournamentGroupId).toBeNull() // the final
  })

  // Inverno's semifinal pairs two teams of the same group, so "same group on both sides"
  // is not enough on its own to call a match a group match.
  it('leaves a knockout game between two teams of the same group ungrouped', () => {
    const semifinal = getMatchesByTournament(2).find((m) => m.id === 213)
    expect(semifinal?.tournamentGroupId).toBeNull()
  })
})

describe('PUC sports mock data', () => {
  it('exposes exactly 2 tournaments', () => {
    expect(getTournaments()).toHaveLength(2)
  })

  it('Geral has 16 teams, 31 finished matches, Time 1 champion', () => {
    const c = getTournamentById(1)
    expect(c?.enrolledTeamCount).toBe(16)
    expect(c?.status).toBe('COMPLETED')
    expect(c?.championTournamentTeamId).toBe(1001)
    const matches = getMatchesByTournament(1)
    expect(matches).toHaveLength(31)
    expect(matches.every((m) => m.status === 'FINISHED')).toBe(true)
  })

  it('seeds matches with tournamentTeamId sides, not raw global team ids', () => {
    const match = getMatchesByTournament(SEED_TOURNAMENT.GERAL).find((m) => m.id === 101)!
    expect(match.homeTournamentTeamId).toBe(tournamentTeamId(SEED_TOURNAMENT.GERAL, 1))
    expect(match.awayTournamentTeamId).toBe(tournamentTeamId(SEED_TOURNAMENT.GERAL, 2))
  })

  it('reports tournament enrolledTeamCount instead of a teamIds array', () => {
    const geral = getTournamentById(SEED_TOURNAMENT.GERAL)!
    expect(geral.enrolledTeamCount).toBe(16)
    expect('teamIds' in geral).toBe(false)
  })

  it('keeps the declared champion on the completed demo tournament', () => {
    const tournament = getTournamentById(1)
    expect(tournament?.championTournamentTeamId).toBe(1001)
  })

  it('seeds Inverno with scheduled matches and no finished-result fields', () => {
    const matches = getMatchesByTournament(2)
    expect(matches).toHaveLength(16)
    expect(matches.every((m) => m.status === 'SCHEDULED')).toBe(true)
    expect(matches.every((m) => m.homeScore === null && m.awayScore === null)).toBe(true)
    expect(matches.every((m) => m.scoreSource === null)).toBe(true)
    expect(matches.every((m) => m.homeLossType === null && m.awayLossType === null)).toBe(true)
  })

  it('all team IDs in matches exist in MOCK_TEAMS', () => {
    const teamIds = new Set(MOCK_TEAMS.map((t) => t.id))
    getAllMatches().forEach((m) => {
      expect(teamIds.has(m.homeTournamentTeamId - 1000 * m.tournamentId)).toBe(true)
      expect(teamIds.has(m.awayTournamentTeamId - 1000 * m.tournamentId)).toBe(true)
    })
  })
})
