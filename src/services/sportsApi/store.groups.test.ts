import { describe, it, expect } from 'vitest'
import { createSportsStore } from './store'

const freshTournament = () => {
  const store = createSportsStore({ tournaments: [], matches: [] })
  const t = store.createTournament({ name: 'Copa', seasonId: 1, format: 'GROUP_STAGE_KNOCKOUT' })
  const home = store.enrollTeam({ tournamentId: t.id, teamId: 1, displayName: 'Tigres' })
  const away = store.enrollTeam({ tournamentId: t.id, teamId: 2, displayName: 'Albatrozes' })
  return { store, tournamentId: t.id, homeTournamentTeamId: home.id, awayTournamentTeamId: away.id }
}

describe('groups store', () => {
  it('creates and lists groups sorted by sortOrder', () => {
    const { store, tournamentId } = freshTournament()
    store.createGroup({ tournamentId, name: 'Grupo B', sortOrder: 2 })
    store.createGroup({ tournamentId, name: 'Grupo A', sortOrder: 1 })
    expect(store.listGroups(tournamentId).map((g) => g.name)).toEqual(['Grupo A', 'Grupo B'])
  })

  it('rejects assigning a team to two groups in the same tournament', () => {
    const { store, tournamentId, homeTournamentTeamId } = freshTournament()
    const a = store.createGroup({ tournamentId, name: 'Grupo A' })
    const b = store.createGroup({ tournamentId, name: 'Grupo B' })
    store.assignTeamToGroup({ tournamentId, groupId: a.id, tournamentTeamId: homeTournamentTeamId })
    expect(() => store.assignTeamToGroup({ tournamentId, groupId: b.id, tournamentTeamId: homeTournamentTeamId })).toThrow(/already assigned to a group/i)
  })

  it('lets a removed team be assigned again', () => {
    const { store, tournamentId, homeTournamentTeamId } = freshTournament()
    const a = store.createGroup({ tournamentId, name: 'Grupo A' })
    const b = store.createGroup({ tournamentId, name: 'Grupo B' })
    const link = store.assignTeamToGroup({ tournamentId, groupId: a.id, tournamentTeamId: homeTournamentTeamId })
    store.removeGroupTeam(link.id)
    expect(store.assignTeamToGroup({ tournamentId, groupId: b.id, tournamentTeamId: homeTournamentTeamId }).groupId).toBe(b.id)
  })

  it('persists the group on a scheduled match', () => {
    const { store, tournamentId, homeTournamentTeamId, awayTournamentTeamId } = freshTournament()
    const a = store.createGroup({ tournamentId, name: 'Grupo A' })
    store.assignTeamToGroup({ tournamentId, groupId: a.id, tournamentTeamId: homeTournamentTeamId })
    store.assignTeamToGroup({ tournamentId, groupId: a.id, tournamentTeamId: awayTournamentTeamId })
    const m = store.scheduleMatch({ tournamentId, homeTournamentTeamId, awayTournamentTeamId, scheduledAt: '2026-03-01T18:00', groupId: a.id })
    expect(m.tournamentGroupId).toBe(a.id)
  })

  // A match filed into a group its teams do not both belong to would enter no classification
  // table at all: the engine only counts a match when both sides are in the scope.
  it('rejects a match filed into a group that is not the group of both teams', () => {
    const { store, tournamentId, homeTournamentTeamId, awayTournamentTeamId } = freshTournament()
    const a = store.createGroup({ tournamentId, name: 'Grupo A' })
    const b = store.createGroup({ tournamentId, name: 'Grupo B' })
    store.assignTeamToGroup({ tournamentId, groupId: a.id, tournamentTeamId: homeTournamentTeamId })
    store.assignTeamToGroup({ tournamentId, groupId: b.id, tournamentTeamId: awayTournamentTeamId })
    expect(() =>
      store.scheduleMatch({ tournamentId, homeTournamentTeamId, awayTournamentTeamId, scheduledAt: '2026-03-01T18:00', groupId: a.id }),
    ).toThrow(/both teams must belong to the group/i)
  })
})
