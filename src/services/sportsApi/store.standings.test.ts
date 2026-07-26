import { describe, it, expect } from 'vitest'
import { createSportsStore } from './store'
import type { PeriodScore } from '../../features/sports/types'

const period = (n: number, home: number, away: number): PeriodScore => ({
  periodNumber: n, type: 'REGULAR', overtimeNumber: null, homePoints: home, awayPoints: away,
})

/** Tournament id is a plain foreign key here — the store no longer tracks tournaments themselves. */
const TOURNAMENT_ID = 1

/** Two teams that beat each other by the same margin: every FIBA criterion is exhausted. */
const cyclicTie = () => {
  const store = createSportsStore({ matches: [] })
  const alfa = store.enrollTeam({ tournamentId: TOURNAMENT_ID, teamId: 1, displayName: 'Alfa' })
  const beta = store.enrollTeam({ tournamentId: TOURNAMENT_ID, teamId: 2, displayName: 'Beta' })
  const first = store.scheduleMatch({ tournamentId: TOURNAMENT_ID, homeTournamentTeamId: alfa.id, awayTournamentTeamId: beta.id, scheduledAt: '2026-03-01T18:00' })
  const second = store.scheduleMatch({ tournamentId: TOURNAMENT_ID, homeTournamentTeamId: beta.id, awayTournamentTeamId: alfa.id, scheduledAt: '2026-03-08T18:00' })
  store.submitMatchResult({ matchId: first.id, periods: [period(1, 80, 70)], playerStats: [] })
  store.submitMatchResult({ matchId: second.id, periods: [period(1, 80, 70)], playerStats: [] })
  return { store, tournamentId: TOURNAMENT_ID, alfaId: alfa.id, betaId: beta.id }
}

describe('store.listStandings', () => {
  it('monta uma tabela única quando o formato não tem grupos', () => {
    const store = createSportsStore({ matches: [] })
    expect(store.listStandings(TOURNAMENT_ID, 'LEAGUE')).toHaveLength(1)
  })

  it('returns one envelope per group, scoped to the teams and matches of that group', () => {
    const store = createSportsStore({ matches: [] })
    const alfa = store.enrollTeam({ tournamentId: TOURNAMENT_ID, teamId: 1, displayName: 'Alfa' })
    const beta = store.enrollTeam({ tournamentId: TOURNAMENT_ID, teamId: 2, displayName: 'Beta' })
    const gama = store.enrollTeam({ tournamentId: TOURNAMENT_ID, teamId: 3, displayName: 'Gama' })
    const a = store.createGroup({ tournamentId: TOURNAMENT_ID, name: 'Grupo A' })
    const b = store.createGroup({ tournamentId: TOURNAMENT_ID, name: 'Grupo B' })
    store.assignTeamToGroup({ tournamentId: TOURNAMENT_ID, groupId: a.id, tournamentTeamId: alfa.id })
    store.assignTeamToGroup({ tournamentId: TOURNAMENT_ID, groupId: a.id, tournamentTeamId: beta.id })
    store.assignTeamToGroup({ tournamentId: TOURNAMENT_ID, groupId: b.id, tournamentTeamId: gama.id })
    const m = store.scheduleMatch({ tournamentId: TOURNAMENT_ID, homeTournamentTeamId: alfa.id, awayTournamentTeamId: beta.id, scheduledAt: '2026-03-01T18:00', groupId: a.id })
    store.submitMatchResult({ matchId: m.id, periods: [period(1, 80, 70)], playerStats: [] })

    const envelopes = store.listStandings(TOURNAMENT_ID, 'GROUP_STAGE')
    expect(envelopes.map((e) => e.group?.name)).toEqual(['Grupo A', 'Grupo B'])
    expect(envelopes[0].standingsState).toBe('FINAL')
    expect(envelopes[0].rows.map((r) => r.teamName)).toEqual(['Alfa', 'Beta'])
    expect(envelopes[1].standingsState).toBe('EMPTY')  // Grupo B has played nothing
    expect(envelopes[1].rows).toHaveLength(1)
  })

  it('returns a single group-less envelope in LEAGUE', () => {
    const { store, tournamentId } = cyclicTie()
    const envelopes = store.listStandings(tournamentId, 'LEAGUE')
    expect(envelopes).toHaveLength(1)
    expect(envelopes[0].group).toBeNull()
  })
})

describe('store.setTiebreakOrder', () => {
  it('records the draw over the whole block and resolves the tie', () => {
    const { store, tournamentId, alfaId, betaId } = cyclicTie()
    expect(store.listStandings(tournamentId, 'LEAGUE')[0].rows.every((r) => r.isTiedUnresolved)).toBe(true)

    store.setTiebreakOrder({ tournamentId, format: 'LEAGUE', entries: [{ tournamentTeamId: betaId, order: 1 }, { tournamentTeamId: alfaId, order: 2 }] })

    const rows = store.listStandings(tournamentId, 'LEAGUE')[0].rows
    expect(rows.map((r) => r.teamName)).toEqual(['Beta', 'Alfa'])
    expect(rows.every((r) => r.isTiedUnresolved)).toBe(false)
  })

  it('rejects a set that is not a current tie block (the 409)', () => {
    const { store, tournamentId, alfaId } = cyclicTie()
    expect(() => store.setTiebreakOrder({ tournamentId, format: 'LEAGUE', entries: [{ tournamentTeamId: alfaId, order: 1 }] }))
      .toThrow(/tied block no longer matches/i)
  })

  it('rejects an order that is not a complete permutation (the 422)', () => {
    const { store, tournamentId, alfaId, betaId } = cyclicTie()
    expect(() => store.setTiebreakOrder({ tournamentId, format: 'LEAGUE', entries: [{ tournamentTeamId: alfaId, order: 1 }, { tournamentTeamId: betaId, order: 1 }] }))
      .toThrow(/complete permutation/i)
  })

  it('clears the draw, returning the block to unresolved', () => {
    const { store, tournamentId, alfaId, betaId } = cyclicTie()
    store.setTiebreakOrder({ tournamentId, format: 'LEAGUE', entries: [{ tournamentTeamId: betaId, order: 1 }, { tournamentTeamId: alfaId, order: 2 }] })
    const blockKey = store.listStandings(tournamentId, 'LEAGUE')[0].rows[0].tieBlockKey!
    store.clearTiebreakOrder({ tournamentId, blockKey })
    expect(store.listStandings(tournamentId, 'LEAGUE')[0].rows.every((r) => r.isTiedUnresolved)).toBe(true)
  })
})
