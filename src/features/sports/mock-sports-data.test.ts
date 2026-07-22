import { describe, expect, it } from 'vitest'
import {
  getAllMatches,
  getMatchDetailById,
  getMatchesByTournament,
  getTournamentById,
  getTournaments,
  MOCK_TEAMS,
  seedGroupMembership,
  seedMatches,
} from './mock-sports-data'
import { calculatePeriodTotal, getPeriodLabel } from './sportsUtils'
import * as sportsApi from '../../services/sportsApi'
import { SHOOTING_FIELDS } from './statistics'
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
  it('leaves a knockout game between two teams of the same group ungrouped', async () => {
    const semifinal = (await sportsApi.getMatches({ tournamentId: 2 })).find((m) => m.id === 213)
    expect(semifinal?.bracketRound?.label).toBe('Semifinais')
    expect(semifinal?.tournamentGroupId).toBeNull()
  })
})

describe('PUC sports mock data', () => {
  it('stores seeded playing time in seconds', () => {
    const final = getMatchDetailById(131)
    expect(final?.homeStats.players[0].minutesSeconds).toBe(38 * 60)
  })

  it('exposes matches with block and shooting columns not tracked', () => {
    const blocksDisabled = getMatchDetailById(129)!
    const shootingDisabled = getMatchDetailById(130)!

    expect(blocksDisabled.homeStats.players.every((player) => player.blk === null)).toBe(true)
    expect(shootingDisabled.homeStats.players.every((player) =>
      SHOOTING_FIELDS.every((field) => player[field] === null),
    )).toBe(true)
  })

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

  it('seeds a box score side keyed by tournamentTeamId', () => {
    const detail = getMatchDetailById(101)!
    expect(detail.homeStats.tournamentTeamId).toBe(tournamentTeamId(SEED_TOURNAMENT.GERAL, 1))
  })

  it('reports tournament enrolledTeamCount instead of a teamIds array', () => {
    const geral = getTournamentById(SEED_TOURNAMENT.GERAL)!
    expect(geral.enrolledTeamCount).toBe(16)
    expect('teamIds' in geral).toBe(false)
  })

  it('seeds the demo bracket as three named rounds', async () => {
    const rounds = await sportsApi.getBracketRounds(1)
    expect(rounds.map((round) => round.label)).toEqual(['Quartas de final', 'Semifinais', 'Final'])
  })

  it('seeds the demo bracket ending in a single slot won by the declared champion', async () => {
    const rounds = await sportsApi.getBracketRounds(1)
    const slots = await sportsApi.getBracketSlots(1)
    const finalSlots = slots.filter((slot) => slot.roundId === rounds[rounds.length - 1].id)
    expect(finalSlots).toHaveLength(1)
  })

  it('leaves the phase name off the demo slots', async () => {
    const slots = await sportsApi.getBracketSlots(1)
    expect(slots.every((slot) => slot.label === null)).toBe(true)
  })

  it('orders the demo quarter-final slots so adjacent winners meet in the semi they actually contest', async () => {
    const rounds = await sportsApi.getBracketRounds(1)
    const slots = await sportsApi.getBracketSlots(1)
    const quarters = slots.filter((slot) => slot.roundId === rounds[0].id)
    const semis = slots.filter((slot) => slot.roundId === rounds[1].id)
    const semiOf = (winnerId: number | null) =>
      semis.find((semi) => semi.homeTournamentTeamId === winnerId || semi.awayTournamentTeamId === winnerId)?.position
    expect(quarters.map((slot) => semiOf(slot.winnerTournamentTeamId))).toEqual([1, 1, 2, 2])
  })

  it('keeps the declared champion on the completed demo tournament', async () => {
    const tournament = await sportsApi.getTournament(1)
    expect(tournament?.championTournamentTeamId).toBe(1001)
  })

  it('Geral final is OT with consistent box score', () => {
    const final = getMatchesByTournament(1).find((m) => m.id === 131)
    expect(final?.homeTournamentTeamId).toBe(tournamentTeamId(SEED_TOURNAMENT.GERAL, 1))
    expect(final?.awayTournamentTeamId).toBe(tournamentTeamId(SEED_TOURNAMENT.GERAL, 2))
    const detail = getMatchDetailById(final!.id)
    expect(detail?.periodScores?.map(getPeriodLabel)).toContain('OT')
    expect(calculatePeriodTotal(detail!.periodScores, 'home')).toBe(detail?.homeScore)
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
