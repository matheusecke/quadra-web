import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

const getTournaments = vi.hoisted(() => vi.fn())
vi.mock('./tournaments', () => ({ getTournaments }))

import {
  enrollTeam,
  getAllTournamentTeams,
  getTournamentTeams,
  removeTournamentTeam,
  updateTournamentTeam,
} from './tournament-teams'

const registration41 = {
  id: 41, tournamentId: 12, teamId: 8, seed: null, tiebreakOrder: null, tiebreakBlockKey: null,
  displayNameSnapshot: 'Engenharia PUC',
}
const registration42 = {
  id: 42, tournamentId: 12, teamId: 9, seed: null, tiebreakOrder: null, tiebreakBlockKey: null,
  displayNameSnapshot: 'Direito PUC',
}

const page = <T,>(currentPage: number, totalPages: number, data: T[]) => ({
  data,
  meta: { totalItems: data.length, itemCount: data.length, itemsPerPage: 100, totalPages, currentPage },
  links: { first: '?page=1', previous: null, next: null, last: `?page=${totalPages}` },
  statusCode: 200,
})

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
  apiMock.patch.mockReset()
  apiMock.delete.mockReset()
  getTournaments.mockReset()
})

describe('tournament-teams adapter', () => {
  it('loads every active registration page', async () => {
    apiMock.get
      .mockResolvedValueOnce({ data: page(1, 2, [registration41]) })
      .mockResolvedValueOnce({ data: page(2, 2, [registration42]) })
    await expect(getTournamentTeams(12)).resolves.toEqual([registration41, registration42])
    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/tournaments/12/teams', {
      params: { page: 1, limit: 100, status: 'ACTIVE' },
    })
  })

  it('enrolls with teamId only', async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: registration41, statusCode: 201 } })
    await enrollTeam({ tournamentId: 12, teamId: 8 })
    expect(apiMock.post).toHaveBeenCalledWith('/tournaments/12/teams', { teamId: 8 })
  })

  it('patches seed without read-only tiebreak fields', async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: registration41, statusCode: 200 } })
    await updateTournamentTeam(41, { seed: null })
    expect(apiMock.patch).toHaveBeenCalledWith('/tournament-teams/41', { seed: null })
  })

  it('withdraws a registration without reading a response body', async () => {
    apiMock.delete.mockResolvedValueOnce({ status: 204 })
    await expect(removeTournamentTeam(41)).resolves.toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/tournament-teams/41')
  })

  it('composes the cross-tournament registration list from real per-tournament routes', async () => {
    getTournaments.mockResolvedValueOnce([{ id: 12 }, { id: 13 }])
    apiMock.get
      .mockResolvedValueOnce({ data: page(1, 1, [registration41]) })
      .mockResolvedValueOnce({ data: page(1, 1, [registration42]) })
    await expect(getAllTournamentTeams()).resolves.toEqual([registration41, registration42])
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/12/teams', { params: { page: 1, limit: 100, status: 'ACTIVE' } })
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/13/teams', { params: { page: 1, limit: 100, status: 'ACTIVE' } })
  })
})
