import { describe, expect, it } from 'vitest'
import { createSportsStore } from './store'

const fresh = () => {
  const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
  const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
  const tournament = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'LEAGUE', startDate: '2026-02-01', endDate: '2026-06-01' })
  store.enrollTeam({ tournamentId: tournament.id, teamId: 1, displayName: 'Tigres' })
  const entry = store.addRosterEntry({ tournamentId: tournament.id, teamId: 1, athleteId: 101, jerseyNumber: 7, role: 'ATHLETE' })
  return { store, tournamentId: tournament.id, entry }
}

describe('roster update/remove', () => {
  it('updates the jersey number', () => {
    const { store, entry } = fresh()
    expect(store.updateRosterEntry(entry.id, { jerseyNumber: 23 }).jerseyNumber).toBe(23)
  })

  it('removes an entry so it no longer lists', () => {
    const { store, tournamentId, entry } = fresh()
    store.removeRosterEntry(entry.id)
    expect(store.listRoster(tournamentId, 1)).toHaveLength(0)
  })
})
