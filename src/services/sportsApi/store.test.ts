import { describe, it, expect } from 'vitest'
import { createSportsStore } from './store'

describe('createSportsStore', () => {
  it('creates a season and lists it', () => {
    const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
    const created = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
    expect(created.id).toBeTruthy()
    expect(store.listSeasons()).toHaveLength(1)
  })

  it('rejects enrolling the same team twice in one tournament', () => {
    const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
    const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
    const t = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'LEAGUE', startDate: '2026-02-01', endDate: '2026-06-01' })
    store.enrollTeam({ tournamentId: t.id, teamId: 'team-1' })
    expect(() => store.enrollTeam({ tournamentId: t.id, teamId: 'team-1' })).toThrow(/already enrolled/i)
  })

  it('rejects an athlete on two teams in the same tournament', () => {
    const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
    const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
    const t = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'LEAGUE', startDate: '2026-02-01', endDate: '2026-06-01' })
    store.enrollTeam({ tournamentId: t.id, teamId: 'team-1' })
    store.enrollTeam({ tournamentId: t.id, teamId: 'team-2' })
    store.addRosterEntry({ tournamentId: t.id, teamId: 'team-1', athleteId: 'ath-1', jerseyNumber: 7, role: 'ATHLETE' })
    expect(() => store.addRosterEntry({ tournamentId: t.id, teamId: 'team-2', athleteId: 'ath-1', jerseyNumber: 9, role: 'ATHLETE' }))
      .toThrow(/same tournament/i)
  })
})

describe('createTournament', () => {
  it('creates a tournament as a draft, invisible until the admin publishes it', () => {
    const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
    const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
    const created = store.createTournament({
      name: 'Copa', seasonId: season.id, categoryId: null, format: 'LEAGUE',
      startDate: '2026-02-01', endDate: '2026-06-01',
    })
    expect(created.status).toBe('DRAFT')
  })
})
