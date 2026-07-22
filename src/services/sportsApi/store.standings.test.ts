import { describe, it, expect } from 'vitest'
import { createSportsStore } from './store'
import type { PeriodScore } from '../../features/sports/types'

const period = (n: number, home: number, away: number): PeriodScore => ({
  periodNumber: n, type: 'REGULAR', overtimeNumber: null, homePoints: home, awayPoints: away,
})

/** Two teams that beat each other by the same margin: every FIBA criterion is exhausted. */
const cyclicTie = () => {
  const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
  const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
  const t = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'LEAGUE', startDate: '2026-02-01', endDate: '2026-06-01' })
  const alfa = store.enrollTeam({ tournamentId: t.id, teamId: 1, displayName: 'Alfa' })
  const beta = store.enrollTeam({ tournamentId: t.id, teamId: 2, displayName: 'Beta' })
  const first = store.scheduleMatch({ tournamentId: t.id, homeTournamentTeamId: alfa.id, awayTournamentTeamId: beta.id, scheduledAt: '2026-03-01T18:00' })
  const second = store.scheduleMatch({ tournamentId: t.id, homeTournamentTeamId: beta.id, awayTournamentTeamId: alfa.id, scheduledAt: '2026-03-08T18:00' })
  store.submitMatchResult({ matchId: first.id, periods: [period(1, 80, 70)], playerStats: [] })
  store.submitMatchResult({ matchId: second.id, periods: [period(1, 80, 70)], playerStats: [] })
  return { store, tournamentId: t.id, alfaId: alfa.id, betaId: beta.id }
}

describe('store.listStandings', () => {
  it('returns one envelope per group, scoped to the teams and matches of that group', () => {
    const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
    const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
    const t = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'GROUP_STAGE', startDate: '2026-02-01', endDate: '2026-06-01' })
    const alfa = store.enrollTeam({ tournamentId: t.id, teamId: 1, displayName: 'Alfa' })
    const beta = store.enrollTeam({ tournamentId: t.id, teamId: 2, displayName: 'Beta' })
    const gama = store.enrollTeam({ tournamentId: t.id, teamId: 3, displayName: 'Gama' })
    const a = store.createGroup({ tournamentId: t.id, name: 'Grupo A' })
    const b = store.createGroup({ tournamentId: t.id, name: 'Grupo B' })
    store.assignTeamToGroup({ tournamentId: t.id, groupId: a.id, tournamentTeamId: alfa.id })
    store.assignTeamToGroup({ tournamentId: t.id, groupId: a.id, tournamentTeamId: beta.id })
    store.assignTeamToGroup({ tournamentId: t.id, groupId: b.id, tournamentTeamId: gama.id })
    const m = store.scheduleMatch({ tournamentId: t.id, homeTournamentTeamId: alfa.id, awayTournamentTeamId: beta.id, scheduledAt: '2026-03-01T18:00', groupId: a.id })
    store.submitMatchResult({ matchId: m.id, periods: [period(1, 80, 70)], playerStats: [] })

    const envelopes = store.listStandings(t.id)
    expect(envelopes.map((e) => e.group?.name)).toEqual(['Grupo A', 'Grupo B'])
    expect(envelopes[0].standingsState).toBe('FINAL')
    expect(envelopes[0].rows.map((r) => r.teamName)).toEqual(['Alfa', 'Beta'])
    expect(envelopes[1].standingsState).toBe('EMPTY')  // Grupo B has played nothing
    expect(envelopes[1].rows).toHaveLength(1)
  })

  it('returns a single group-less envelope in LEAGUE', () => {
    const { store, tournamentId } = cyclicTie()
    const envelopes = store.listStandings(tournamentId)
    expect(envelopes).toHaveLength(1)
    expect(envelopes[0].group).toBeNull()
  })
})

describe('store.setTiebreakOrder', () => {
  it('records the draw over the whole block and resolves the tie', () => {
    const { store, tournamentId, alfaId, betaId } = cyclicTie()
    expect(store.listStandings(tournamentId)[0].rows.every((r) => r.isTiedUnresolved)).toBe(true)

    store.setTiebreakOrder({ tournamentId, entries: [{ tournamentTeamId: betaId, order: 1 }, { tournamentTeamId: alfaId, order: 2 }] })

    const rows = store.listStandings(tournamentId)[0].rows
    expect(rows.map((r) => r.teamName)).toEqual(['Beta', 'Alfa'])
    expect(rows.every((r) => r.isTiedUnresolved)).toBe(false)
  })

  it('rejects a set that is not a current tie block (the 409)', () => {
    const { store, tournamentId, alfaId } = cyclicTie()
    expect(() => store.setTiebreakOrder({ tournamentId, entries: [{ tournamentTeamId: alfaId, order: 1 }] }))
      .toThrow(/tied block no longer matches/i)
  })

  it('rejects an order that is not a complete permutation (the 422)', () => {
    const { store, tournamentId, alfaId, betaId } = cyclicTie()
    expect(() => store.setTiebreakOrder({ tournamentId, entries: [{ tournamentTeamId: alfaId, order: 1 }, { tournamentTeamId: betaId, order: 1 }] }))
      .toThrow(/complete permutation/i)
  })

  it('clears the draw, returning the block to unresolved', () => {
    const { store, tournamentId, alfaId, betaId } = cyclicTie()
    store.setTiebreakOrder({ tournamentId, entries: [{ tournamentTeamId: betaId, order: 1 }, { tournamentTeamId: alfaId, order: 2 }] })
    const blockKey = store.listStandings(tournamentId)[0].rows[0].tieBlockKey!
    store.clearTiebreakOrder({ tournamentId, blockKey })
    expect(store.listStandings(tournamentId)[0].rows.every((r) => r.isTiedUnresolved)).toBe(true)
  })
})
