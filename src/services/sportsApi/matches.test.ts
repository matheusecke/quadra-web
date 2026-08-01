import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import {
  cancelMatch,
  createMatch,
  getMatch,
  listMatchesPage,
  listTournamentMatchesPage,
  postponeMatch,
  updateMatch,
} from './matches'

const matchSummary = {
  id: 501,
  tournamentId: 31,
  tournamentGroupId: null,
  matchNumber: 4,
  status: 'SCHEDULED' as const,
  scheduledAt: '2026-08-01T22:00:00.000Z',
  startedAt: null,
  endedAt: null,
  venueName: 'Quadra 1',
  bracketRound: null,
  scoreSource: null,
  homeTeam: {
    tournamentTeamId: 41,
    teamName: 'Águias',
    score: null,
    result: null,
    lossType: null,
    isWinner: null,
  },
  awayTeam: {
    tournamentTeamId: 52,
    teamName: 'Falcões',
    score: null,
    result: null,
    lossType: null,
    isWinner: null,
  },
}

const matchDetail = {
  ...matchSummary,
  periods: [],
  playerStats: [],
  mvp: null,
}

const pageEnvelope = {
  data: [matchSummary],
  meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '/matches?page=1', previous: null, next: null, last: '/matches?page=1' },
  statusCode: 200,
}

const createInput = {
  tournamentId: 31,
  tournamentGroupId: null,
  matchNumber: 4,
  scheduledAt: '2026-08-01T22:00:00.000Z',
  venueName: 'Quadra 1',
  homeTournamentTeamId: 41,
  awayTournamentTeamId: 52,
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
  apiMock.patch.mockReset()
})

describe('matches adapter', () => {
  it('preserves the global paginated envelope and filters', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    const params = { page: 2, limit: 20, q: 'Águias', ids: [501, 508], tournamentTeamIds: [41, 52], status: 'SCHEDULED' as const }
    await listMatchesPage(params)
    expect(apiMock.get).toHaveBeenCalledWith('/matches', { params })
  })

  it('returns the global paginated envelope unchanged', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    await expect(listMatchesPage()).resolves.toEqual(pageEnvelope)
  })

  it('lists tournament matches without tournamentId in params', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    await listTournamentMatchesPage(31, { page: 1, limit: 100 })
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/31/matches', { params: { page: 1, limit: 100 } })
  })

  it('gets a detail without query params', async () => {
    apiMock.get.mockResolvedValue({ data: { data: matchDetail, statusCode: 200 } })
    await getMatch(501)
    expect(apiMock.get).toHaveBeenCalledWith('/matches/501')
  })

  it('unwraps the match detail envelope', async () => {
    apiMock.get.mockResolvedValue({ data: { data: matchDetail, statusCode: 200 } })
    await expect(getMatch(501)).resolves.toEqual(matchDetail)
  })

  it('creates with the literal input body', async () => {
    apiMock.post.mockResolvedValue({ data: { data: matchDetail, statusCode: 201 } })
    await createMatch(createInput)
    expect(apiMock.post).toHaveBeenCalledWith('/matches', createInput)
  })

  it('patches nullable fields without coercion', async () => {
    const input = { tournamentGroupId: null, matchNumber: null, venueName: null }
    apiMock.patch.mockResolvedValue({ data: { data: matchDetail, statusCode: 200 } })
    await updateMatch(501, input)
    expect(apiMock.patch).toHaveBeenCalledWith('/matches/501', input)
  })

  it('postpones without body or query', async () => {
    apiMock.post.mockResolvedValue({ data: { data: { ...matchDetail, status: 'POSTPONED' }, statusCode: 200 } })
    await postponeMatch(501)
    expect(apiMock.post).toHaveBeenCalledWith('/matches/501/postpone')
  })

  it('cancels without body or query', async () => {
    apiMock.post.mockResolvedValue({ data: { data: { ...matchDetail, status: 'CANCELLED' }, statusCode: 200 } })
    await cancelMatch(501)
    expect(apiMock.post).toHaveBeenCalledWith('/matches/501/cancel')
  })
})
