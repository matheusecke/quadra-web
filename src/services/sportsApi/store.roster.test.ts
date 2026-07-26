import { describe, expect, it } from 'vitest'
import { createSportsStore } from './store'

/** Tournament id is a plain foreign key here — the store no longer tracks tournaments themselves. */
const TOURNAMENT_ID = 1

const fresh = () => {
  const store = createSportsStore({ matches: [] })
  const tournamentTeam = store.enrollTeam({ tournamentId: TOURNAMENT_ID, teamId: 1, displayName: 'Tigres' })
  const entry = store.addRosterEntry({ tournamentId: TOURNAMENT_ID, tournamentTeamId: tournamentTeam.id, athleteId: 101, jerseyNumber: 7, role: 'ATHLETE' })
  return { store, tournamentId: TOURNAMENT_ID, tournamentTeamId: tournamentTeam.id, entry }
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
