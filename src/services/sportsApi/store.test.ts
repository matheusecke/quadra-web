import { describe, it, expect } from 'vitest'
import type { PeriodScore } from '../../features/sports/types'
import { createSportsStore } from './store'

const period = (n: number, home: number, away: number): PeriodScore => ({
  periodNumber: n, type: 'REGULAR', overtimeNumber: null, homePoints: home, awayPoints: away,
})

function scheduledMatch() {
  const store = createSportsStore({ tournaments: [], matches: [] })
  const tournament = store.createTournament({
    name: 'Copa', seasonId: 1, categoryId: null, format: 'LEAGUE', startDate: '2026-02-01', endDate: '2026-06-01',
  })
  const homeTournamentTeam = store.enrollTeam({ tournamentId: tournament.id, teamId: 1, displayName: 'Tigres' })
  const awayTournamentTeam = store.enrollTeam({ tournamentId: tournament.id, teamId: 2, displayName: 'Albatrozes' })
  const match = store.scheduleMatch({
    tournamentId: tournament.id, homeTournamentTeamId: homeTournamentTeam.id, awayTournamentTeamId: awayTournamentTeam.id, scheduledAt: '2026-03-01T20:00:00Z',
  })
  return { store, matchId: match.id, homeTournamentTeamId: homeTournamentTeam.id, awayTournamentTeamId: awayTournamentTeam.id }
}

describe('createSportsStore', () => {
  it('rejects enrolling the same team twice in one tournament', () => {
    const store = createSportsStore({ tournaments: [], matches: [] })
    const t = store.createTournament({ name: 'Copa', seasonId: 1, categoryId: null, format: 'LEAGUE', startDate: '2026-02-01', endDate: '2026-06-01' })
    store.enrollTeam({ tournamentId: t.id, teamId: 1, displayName: 'Tigres' })
    expect(() => store.enrollTeam({ tournamentId: t.id, teamId: 1, displayName: 'Tigres' })).toThrow(/already enrolled/i)
  })

  it('rejects an athlete on two teams in the same tournament', () => {
    const store = createSportsStore({ tournaments: [], matches: [] })
    const t = store.createTournament({ name: 'Copa', seasonId: 1, categoryId: null, format: 'LEAGUE', startDate: '2026-02-01', endDate: '2026-06-01' })
    const home = store.enrollTeam({ tournamentId: t.id, teamId: 1, displayName: 'Tigres' })
    const away = store.enrollTeam({ tournamentId: t.id, teamId: 2, displayName: 'Albatrozes' })
    store.addRosterEntry({ tournamentId: t.id, tournamentTeamId: home.id, athleteId: 101, jerseyNumber: 7, role: 'ATHLETE' })
    expect(() => store.addRosterEntry({ tournamentId: t.id, tournamentTeamId: away.id, athleteId: 101, jerseyNumber: 9, role: 'ATHLETE' }))
      .toThrow(/same tournament/i)
  })
})

describe('createTournament', () => {
  it('creates a tournament as a draft, invisible until the admin publishes it', () => {
    const store = createSportsStore({ tournaments: [], matches: [] })
    const created = store.createTournament({
      name: 'Copa', seasonId: 1, categoryId: null, format: 'LEAGUE',
      startDate: '2026-02-01', endDate: '2026-06-01',
    })
    expect(created.status).toBe('DRAFT')
  })
})

describe('submitMatchResult — W.O. (FORFEIT)', () => {
  it('awards 20 x 0 to whoever showed up, with no periods and no box score', () => {
    const { store, matchId, awayTournamentTeamId } = scheduledMatch()
    const match = store.submitMatchResult({
      resultType: 'FORFEIT', matchId, offendingTournamentTeamId: awayTournamentTeamId,
    })
    expect(match.homeScore).toBe(20)
    expect(match.awayScore).toBe(0)
    expect(match.status).toBe('FINISHED')
    expect(match).not.toHaveProperty(['stats', 'Status'].join(''))
    expect(match.awayLossType).toBe('FORFEIT')
    expect(match.scoreSource).toBe('AWARDED')
    const detail = store.getMatchDetail(matchId)!
    expect(detail.periodScores).toEqual([])
    expect(detail.homeStats.players).toEqual([])
    expect(detail.awayStats.players).toEqual([])
    expect(detail.mvp).toBeNull()
  })
})

describe('submitMatchResult — abandonment (DEFAULT)', () => {
  it('keeps the court score when the opponent was already ahead', () => {
    const { store, matchId, awayTournamentTeamId } = scheduledMatch()
    const match = store.submitMatchResult({
      resultType: 'DEFAULT', matchId, offendingTournamentTeamId: awayTournamentTeamId,
      periods: [period(1, 40, 30)], playerStats: [],
    })
    expect(match.homeScore).toBe(40)
    expect(match.awayScore).toBe(30)
    expect(match.scoreSource).toBe('PERIODS')
    expect(match.awayLossType).toBe('DEFAULT')
  })

  it('awards 2 x 0 to the opponent when the offender was ahead (FIBA Art. 21)', () => {
    const { store, matchId, awayTournamentTeamId } = scheduledMatch()
    const match = store.submitMatchResult({
      resultType: 'DEFAULT', matchId, offendingTournamentTeamId: awayTournamentTeamId,
      periods: [period(1, 40, 55)], playerStats: [],
    })
    expect(match.homeScore).toBe(2)
    expect(match.awayScore).toBe(0)
    expect(match.scoreSource).toBe('AWARDED')
  })
})

describe('submitMatchResult — NORMAL', () => {
  it('takes the score from the periods and marks the loser NORMAL', () => {
    const { store, matchId } = scheduledMatch()
    const match = store.submitMatchResult({ matchId, periods: [period(1, 70, 60)], playerStats: [] })
    expect(match.homeScore).toBe(70)
    expect(match.awayScore).toBe(60)
    expect(match.scoreSource).toBe('PERIODS')
    expect(match.awayLossType).toBe('NORMAL')
    expect(match.homeLossType).toBeNull()
  })

  it('round-trips null metrics through submit → getMatchDetail', () => {
    const { store, matchId, homeTournamentTeamId, awayTournamentTeamId } = scheduledMatch()
    const tournamentId = store.listTournaments()[0].id
    const homeEntry = store.addRosterEntry({
      tournamentId, tournamentTeamId: homeTournamentTeamId, athleteId: 101, jerseyNumber: 7, role: 'ATHLETE',
    })
    const awayEntry = store.addRosterEntry({
      tournamentId, tournamentTeamId: awayTournamentTeamId, athleteId: 102, jerseyNumber: 11, role: 'ATHLETE',
    })

    store.submitMatchResult({
      matchId,
      periods: [period(1, 0, 0)],
      playerStats: [
        { tournamentRosterId: homeEntry.id, pts: 0, fgm: 0, fga: 0, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0, reb: null, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, minutesSeconds: 0 },
        { tournamentRosterId: awayEntry.id, pts: 0, fgm: 0, fga: 0, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0, reb: null, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, minutesSeconds: 0 },
      ],
    })

    const detail = store.getMatchDetail(matchId)!
    expect(detail.homeStats.players.every((player) => player.reb === null)).toBe(true)
    expect(detail.awayStats.players.every((player) => player.reb === null)).toBe(true)
  })
})

describe('submitMatchResult — MVP', () => {
  it('persists the MVP and returns it on the match detail', () => {
    const { store, matchId, homeTournamentTeamId } = scheduledMatch()
    const entry = store.addRosterEntry({
      tournamentId: store.listTournaments()[0].id, tournamentTeamId: homeTournamentTeamId,
      athleteId: 101, jerseyNumber: 7, role: 'ATHLETE',
    })

    store.submitMatchResult({
      matchId,
      periods: [period(1, 70, 60)],
      playerStats: [{ tournamentRosterId: entry.id, pts: 20, fgm: 8, fga: 15, threeFgm: 2, threeFga: 5, ftm: 2, fta: 2, reb: 5, ast: 3, stl: 1, blk: 0, tov: 2, pf: 3, minutesSeconds: 1800 }],
      mvpTournamentRosterId: entry.id,
    })

    expect(store.getMatchDetail(matchId)?.mvp).toEqual({ tournamentRosterId: entry.id, athleteId: 101 })
  })

  it('rejects an MVP with no line in the box score', () => {
    const { store, matchId } = scheduledMatch()

    expect(() =>
      store.submitMatchResult({
        matchId,
        periods: [period(1, 70, 60)],
        playerStats: [],
        mvpTournamentRosterId: 999999,
      }),
    ).toThrow(/MVP must be one of the players in the box score/i)
  })

  it('rejects a coaching staff member as MVP even with a box-score line', () => {
    const { store, matchId, homeTournamentTeamId } = scheduledMatch()
    const entry = store.addRosterEntry({
      tournamentId: store.listTournaments()[0].id, tournamentTeamId: homeTournamentTeamId,
      athleteId: 201, jerseyNumber: 7, role: 'COACHING_STAFF',
    })

    expect(() =>
      store.submitMatchResult({
        matchId,
        periods: [period(1, 70, 60)],
        playerStats: [{ tournamentRosterId: entry.id, pts: 0, fgm: 0, fga: 0, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, minutesSeconds: 0 }],
        mvpTournamentRosterId: entry.id,
      }),
    ).toThrow(/MVP must be one of the players in the box score/i)
  })

  it('leaves the MVP null on a W.O. — there was no game to be best in', () => {
    const { store, matchId, awayTournamentTeamId } = scheduledMatch()
    store.submitMatchResult({ resultType: 'FORFEIT', matchId, offendingTournamentTeamId: awayTournamentTeamId })

    expect(store.getMatchDetail(matchId)?.mvp).toBeNull()
  })
})
