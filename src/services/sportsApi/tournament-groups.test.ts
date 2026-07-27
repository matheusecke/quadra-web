import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import {
  assignTeamToGroup,
  createGroup,
  getGroups,
  getGroupTeams,
  removeGroup,
  removeGroupTeam,
  updateGroup,
} from './tournament-groups'

const groupA = {
  id: 7, tournamentId: 12, name: 'Grupo A', sortOrder: null,
  createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
}

const membership31 = {
  id: 31, tournamentId: 12, tournamentGroupId: 7, tournamentTeamId: 41,
  createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
  apiMock.patch.mockReset()
  apiMock.delete.mockReset()
})

describe('tournament-groups adapter', () => {
  it('reads groups without query parameters', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [groupA], statusCode: 200 } })
    await expect(getGroups(12)).resolves.toEqual([groupA])
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/12/groups')
  })

  it('creates a group with the name only', async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: groupA, statusCode: 201 } })
    await createGroup({ tournamentId: 12, name: 'Grupo A' })
    expect(apiMock.post).toHaveBeenCalledWith('/tournaments/12/groups', { name: 'Grupo A' })
  })

  it('renames a group', async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { ...groupA, name: 'Grupo Ouro' }, statusCode: 200 } })
    await updateGroup(7, { name: 'Grupo Ouro' })
    expect(apiMock.patch).toHaveBeenCalledWith('/tournament-groups/7', { name: 'Grupo Ouro' })
  })

  it('deletes a group without reading a response body', async () => {
    apiMock.delete.mockResolvedValueOnce({ status: 204 })
    await expect(removeGroup(7)).resolves.toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/tournament-groups/7')
  })

  it('reads group-team memberships without query parameters', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [membership31], statusCode: 200 } })
    await expect(getGroupTeams(12)).resolves.toEqual([membership31])
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/12/group-teams')
  })

  it('assigns a team with the two ids the API accepts', async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: membership31, statusCode: 201 } })
    await assignTeamToGroup({ tournamentGroupId: 7, tournamentTeamId: 41 })
    expect(apiMock.post).toHaveBeenCalledWith('/tournament-group-teams', { tournamentGroupId: 7, tournamentTeamId: 41 })
  })

  it('deletes a group-team membership without reading a response body', async () => {
    apiMock.delete.mockResolvedValueOnce({ status: 204 })
    await expect(removeGroupTeam(31)).resolves.toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/tournament-group-teams/31')
  })
})
