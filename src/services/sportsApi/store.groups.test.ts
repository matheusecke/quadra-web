import { describe, it, expect } from 'vitest'
import { createSportsStore } from './store'

const freshTournament = () => {
  const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
  const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
  const t = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'GROUP_STAGE_KNOCKOUT', startDate: '2026-02-01', endDate: '2026-06-01' })
  store.enrollTeam({ tournamentId: t.id, teamId: 'team-1', displayName: 'Tigres' })
  store.enrollTeam({ tournamentId: t.id, teamId: 'team-2', displayName: 'Albatrozes' })
  return { store, tournamentId: t.id }
}

describe('groups store', () => {
  it('creates and lists groups sorted by sortOrder', () => {
    const { store, tournamentId } = freshTournament()
    store.createGroup({ tournamentId, name: 'Grupo B', sortOrder: 2 })
    store.createGroup({ tournamentId, name: 'Grupo A', sortOrder: 1 })
    expect(store.listGroups(tournamentId).map((g) => g.name)).toEqual(['Grupo A', 'Grupo B'])
  })

  it('rejects assigning a team to two groups in the same tournament', () => {
    const { store, tournamentId } = freshTournament()
    const a = store.createGroup({ tournamentId, name: 'Grupo A' })
    const b = store.createGroup({ tournamentId, name: 'Grupo B' })
    store.assignTeamToGroup({ tournamentId, groupId: a.id, teamId: 'team-1' })
    expect(() => store.assignTeamToGroup({ tournamentId, groupId: b.id, teamId: 'team-1' })).toThrow(/already assigned to a group/i)
  })

  it('lets a removed team be assigned again', () => {
    const { store, tournamentId } = freshTournament()
    const a = store.createGroup({ tournamentId, name: 'Grupo A' })
    const b = store.createGroup({ tournamentId, name: 'Grupo B' })
    const link = store.assignTeamToGroup({ tournamentId, groupId: a.id, teamId: 'team-1' })
    store.removeGroupTeam(link.id)
    expect(store.assignTeamToGroup({ tournamentId, groupId: b.id, teamId: 'team-1' }).groupId).toBe(b.id)
  })

  it('persists the group on a scheduled match', () => {
    const { store, tournamentId } = freshTournament()
    const a = store.createGroup({ tournamentId, name: 'Grupo A' })
    const m = store.scheduleMatch({ tournamentId, homeTeamId: 'team-1', awayTeamId: 'team-2', scheduledAt: '2026-03-01T18:00', groupId: a.id })
    expect(m.tournamentGroupId).toBe(a.id)
  })
})
