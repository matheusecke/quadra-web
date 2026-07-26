import { describe, expect, it } from 'vitest'
import { createSportsStore } from './store'

const fresh = () => {
  const store = createSportsStore({ tournaments: [], matches: [] })
  const tournament = store.createTournament({ name: 'Copa', seasonId: 1, format: 'LEAGUE' })
  const tournamentTeam = store.enrollTeam({ tournamentId: tournament.id, teamId: 1, displayName: 'Tigres' })
  const entry = store.addRosterEntry({ tournamentId: tournament.id, tournamentTeamId: tournamentTeam.id, athleteId: 101, jerseyNumber: 7, role: 'ATHLETE' })
  return { store, tournamentId: tournament.id, tournamentTeamId: tournamentTeam.id, entry }
}

describe('roster update/remove', () => {
  it('updates the jersey number', () => {
    const { store, entry } = fresh()
    expect(store.updateRosterEntry(entry.id, { jerseyNumber: 23 }).jerseyNumber).toBe(23)
  })

  it('removes an entry so it no longer lists', () => {
    const { store, tournamentId, tournamentTeamId, entry } = fresh()
    store.removeRosterEntry(entry.id)
    expect(store.listRoster(tournamentId, tournamentTeamId)).toHaveLength(0)
  })
})
