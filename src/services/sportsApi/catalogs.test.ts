import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import {
  getTeams,
  listRosterCandidatesPage,
  listTeamsPage,
  searchRosterCandidates,
  searchTeams,
} from './catalogs'

const team8 = { id: 8, name: 'Engenharia PUC', shortName: 'ENG', city: 'Campinas' }
const team9 = { id: 9, name: 'Direito PUC', shortName: 'DIR', city: 'Campinas' }

const page = <T,>(currentPage: number, totalPages: number, data: T[]) => ({
  data,
  meta: { totalItems: data.length, itemCount: data.length, itemsPerPage: 100, totalPages, currentPage },
  links: { first: '?page=1', previous: null, next: null, last: `?page=${totalPages}` },
  statusCode: 200,
})

const candidate165 = { id: 165, name: 'Rafael Moura', teamId: 8, role: 'ATHLETE' as const, jerseyNumber: 4 }

beforeEach(() => {
  apiMock.get.mockReset()
})

describe('sportsApi catalogs', () => {
  it('serializes team filters without organizationId', async () => {
    apiMock.get.mockResolvedValueOnce({ data: page(2, 2, [team9]) })
    await listTeamsPage({ page: 2, limit: 20, q: 'engenharia', ids: [8, 9], status: 'ACTIVE' })
    expect(apiMock.get).toHaveBeenCalledWith('/teams', {
      params: { page: 2, limit: 20, q: 'engenharia', ids: [8, 9], status: 'ACTIVE' },
    })
  })

  it('collects every team search page with ACTIVE status', async () => {
    apiMock.get
      .mockResolvedValueOnce({ data: page(1, 2, [team8]) })
      .mockResolvedValueOnce({ data: page(2, 2, [team9]) })
    await expect(searchTeams('eng')).resolves.toEqual([team8, team9])
    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/teams', {
      params: { page: 1, limit: 100, q: 'eng', status: 'ACTIVE' },
    })
    expect(apiMock.get).toHaveBeenNthCalledWith(2, '/teams', {
      params: { page: 2, limit: 100, q: 'eng', status: 'ACTIVE' },
    })
  })

  it('sends repeated ids unchanged for the shared serializer', async () => {
    apiMock.get.mockResolvedValueOnce({ data: page(1, 1, [team8, team9]) })
    await getTeams({ ids: [165, 166] })
    expect(apiMock.get).toHaveBeenCalledWith('/teams', {
      params: { ids: [165, 166], page: 1, limit: 100 },
    })
  })

  it('collects roster candidates with team, role, and query filters', async () => {
    apiMock.get.mockResolvedValueOnce({ data: page(1, 1, [candidate165]) })
    await searchRosterCandidates({ teamId: 8, role: 'ATHLETE', q: 'rafael' })
    expect(apiMock.get).toHaveBeenCalledWith('/athletes', {
      params: { page: 1, limit: 100, teamId: 8, role: 'ATHLETE', q: 'rafael' },
    })
  })

  it('reads a single roster-candidate page envelope directly', async () => {
    apiMock.get.mockResolvedValueOnce({ data: page(1, 1, [candidate165]) })
    await expect(listRosterCandidatesPage({ teamId: 8 })).resolves.toEqual(page(1, 1, [candidate165]))
  })
})
