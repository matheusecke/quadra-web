import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import { getTeamSummary, listTeamMatchesPage, listTeamTournamentsPage } from './team-profile'

const statistics = {
  results: {
    measuredGames: 18,
    winRate: 0.667,
    scoreMeasuredGames: 16,
    pointsForPerGame: 73.125,
    pointsAgainstPerGame: 68.5,
    pointDiffPerGame: 4.625,
  },
  boxScore: {
    measuredGames: { reb: 14, ast: 14, stl: 12, blk: 12, tov: 14, pf: 14 },
    perGame: { reb: 38.286, ast: 17.143, stl: null, blk: 3.25, tov: 11.786, pf: 16.214 },
    shooting: { fgPct: 0.481, threeFgPct: null, ftPct: 0.742, trueShootingPct: 0.571 },
    efficiency: { measuredGames: 12, perGame: 82.417 },
  },
}

const pageMeta = { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 }
const pageLinks = { first: '?page=1', previous: null, next: null, last: '?page=1' }

beforeEach(() => apiMock.get.mockReset())

describe('team profile adapter', () => {
  it('unwraps the summary envelope without recalculating null averages', async () => {
    const summary = {
      team: { id: 8, name: 'Engenharia PUC', shortName: 'EPU', city: null, state: 'SP', status: 'HISTORICAL' },
      titles: [{
        tournament: {
          id: 12, name: 'Intercursos 2026', seasonId: 7, seasonLabel: '2026',
          startsAt: '2026-05-02T12:00:00.000Z', endsAt: null,
        },
      }],
      statistics,
    }
    apiMock.get.mockResolvedValueOnce({ data: { data: summary, statusCode: 200 } })

    await expect(getTeamSummary(8)).resolves.toEqual(summary)
  })

  it('requests the summary of the given global team id', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: null, statusCode: 200 } })

    await getTeamSummary(8)

    expect(apiMock.get).toHaveBeenCalledWith('/teams/8/summary')
  })

  it('preserves the complete upcoming match page', async () => {
    const row = {
      match: {
        id: 501, status: 'SCHEDULED', scheduledAt: '2026-08-15T19:30:00.000Z',
        venueName: null, scoreSource: null,
      },
      tournament: { id: 12, name: 'Intercursos 2026', seasonId: 7, seasonLabel: '2026' },
      team: {
        tournamentTeamId: 41, teamId: 8, name: 'Engenharia PUC',
        score: null, result: null, lossType: null, isWinner: null,
      },
      opponent: {
        tournamentTeamId: 42, teamId: 9, name: 'Direito PUC',
        score: null, result: null, lossType: null, isWinner: null,
      },
    }
    const envelope = { data: [row], meta: pageMeta, links: pageLinks, statusCode: 200 }
    apiMock.get.mockResolvedValueOnce({ data: envelope })

    await expect(listTeamMatchesPage(8, { scope: 'upcoming', page: 1, limit: 20 })).resolves.toEqual(envelope)
  })

  it('sends the required scope with the match pagination params', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [], meta: pageMeta, links: pageLinks, statusCode: 200 } })

    await listTeamMatchesPage(8, { scope: 'history', page: 2, limit: 20 })

    expect(apiMock.get).toHaveBeenCalledWith('/teams/8/matches', {
      params: { scope: 'history', page: 2, limit: 20 },
    })
  })

  it('preserves a tournament participation with no measured statistics', async () => {
    const row = {
      tournament: {
        id: 12, name: 'Intercursos 2026', seasonId: 7, seasonLabel: '2026',
        status: 'IN_PROGRESS', startsAt: null, endsAt: null,
      },
      team: {
        tournamentTeamId: 41, teamId: 8, name: 'Engenharia PUC',
        status: 'WITHDRAWN', isChampion: false,
      },
      statistics: {
        results: {
          measuredGames: 0, winRate: null, scoreMeasuredGames: 0,
          pointsForPerGame: null, pointsAgainstPerGame: null, pointDiffPerGame: null,
        },
        boxScore: {
          measuredGames: { reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 },
          perGame: { reb: null, ast: null, stl: null, blk: null, tov: null, pf: null },
          shooting: { fgPct: null, threeFgPct: null, ftPct: null, trueShootingPct: null },
          efficiency: { measuredGames: 0, perGame: null },
        },
      },
    }
    const envelope = { data: [row], meta: pageMeta, links: pageLinks, statusCode: 200 }
    apiMock.get.mockResolvedValueOnce({ data: envelope })

    await expect(listTeamTournamentsPage(8, { page: 1, limit: 20 })).resolves.toEqual(envelope)
  })

  it('requests the tournament history of the given global team id', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [], meta: pageMeta, links: pageLinks, statusCode: 200 } })

    await listTeamTournamentsPage(8)

    expect(apiMock.get).toHaveBeenCalledWith('/teams/8/tournaments', { params: {} })
  })

  it('propagates a not-found error unchanged for the page handler', async () => {
    const error = Object.assign(new Error('not found'), {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Team not found' } },
    })
    apiMock.get.mockRejectedValueOnce(error)

    await expect(getTeamSummary(9999)).rejects.toBe(error)
  })
})
