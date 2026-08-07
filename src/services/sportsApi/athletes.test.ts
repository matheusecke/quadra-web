import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import {
  getAthlete,
  getAthleteStatistics,
  listAthleteMatchesPage,
  listAthleteTournamentsPage,
} from './athletes'

const metrics = {
  minutesSeconds: 0,
  pts: 2,
  reb: 0,
  ast: 2,
  stl: 2,
  blk: 2,
  tov: 2,
  pf: 2,
  fgm: 2,
  fga: 2,
  threeFgm: 2,
  threeFga: 2,
  ftm: 2,
  fta: 2,
}

const nullableMetrics = {
  minutesSeconds: null,
  pts: 0,
  reb: null,
  ast: 3,
  stl: 0,
  blk: 0,
  tov: 1,
  pf: 2,
  fgm: 8,
  fga: 6,
  threeFgm: 2,
  threeFga: 1,
  ftm: 4,
  fta: 3,
}

const statistics = {
  gamesPlayed: 3,
  measuredGames: metrics,
  totals: nullableMetrics,
  perGame: { ...nullableMetrics, pts: 0, ast: 1.5 },
  shooting: { fgPct: 1.333, threeFgPct: 2, ftPct: 1.333, trueShootingPct: 1.4 },
  efficiency: { measuredGames: 2, total: 7, perGame: 3.5 },
}

const pageMeta = { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 }
const pageLinks = { first: '?page=1', previous: null, next: null, last: '?page=1' }

beforeEach(() => apiMock.get.mockReset())

describe('athletes adapter', () => {
  it('unwraps a historical-only athlete profile without changing null fields', async () => {
    const athlete = {
      id: 165,
      name: 'Current Name',
      currentTeamId: null,
      jerseyNumber: null,
      position: null,
      status: 'INACTIVE',
    }
    apiMock.get.mockResolvedValueOnce({ data: { data: athlete, statusCode: 200 } })

    await expect(getAthlete(165)).resolves.toEqual(athlete)
    expect(apiMock.get).toHaveBeenCalledWith('/athletes/165')
  })

  it('unwraps server-owned statistics without recalculating null, zero or percentages', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: statistics, statusCode: 200 } })

    await expect(getAthleteStatistics(165)).resolves.toEqual(statistics)
    expect(apiMock.get).toHaveBeenCalledWith('/athletes/165/statistics')
  })

  it('preserves the complete match page and passes supported filters unchanged', async () => {
    const row = {
      match: { id: 501, scheduledAt: '2026-08-15T19:30:00.000Z' },
      tournament: { id: 12, name: 'Intercourses 2026' },
      athleteName: 'Historical Athlete',
      team: { tournamentTeamId: 41, teamId: 8, name: 'Historical Team' },
      opponent: { tournamentTeamId: 52, teamId: 15, name: 'Historical Opponent' },
      result: { result: 'LOSS', lossType: 'FORFEIT', pointsFor: 0, pointsAgainst: 20 },
      stats: { tournamentRosterId: 88, ...nullableMetrics },
      derived: { fgPct: 1.333, threeFgPct: 2, ftPct: 1.333, trueShootingPct: 1.4, efficiency: null },
    }
    const envelope = { data: [row], meta: pageMeta, links: pageLinks, statusCode: 200 }
    apiMock.get.mockResolvedValueOnce({ data: envelope })

    await expect(listAthleteMatchesPage(165, { page: 2, limit: 20, ids: [501, 502], tournamentId: 12 }))
      .resolves.toEqual(envelope)
    expect(apiMock.get).toHaveBeenCalledWith('/athletes/165/matches', {
      params: { page: 2, limit: 20, ids: [501, 502], tournamentId: 12 },
    })
  })

  it('preserves the complete tournament page and nested statistics', async () => {
    const row = {
      tournament: { id: 12, name: 'Intercourses 2026', seasonId: 7, startsAt: null },
      team: { tournamentTeamId: 41, teamId: 8, name: 'Historical Team' },
      statistics,
    }
    const envelope = { data: [row], meta: pageMeta, links: pageLinks, statusCode: 200 }
    apiMock.get.mockResolvedValueOnce({ data: envelope })

    await expect(listAthleteTournamentsPage(165, { page: 1, limit: 20, ids: [12], seasonId: 7 }))
      .resolves.toEqual(envelope)
    expect(apiMock.get).toHaveBeenCalledWith('/athletes/165/tournaments', {
      params: { page: 1, limit: 20, ids: [12], seasonId: 7 },
    })
  })

  it('propagates API errors unchanged for the shared auth and section handlers', async () => {
    const error = Object.assign(new Error('forbidden'), {
      isAxiosError: true,
      response: { status: 403, data: { message: 'Forbidden resource' } },
    })
    apiMock.get.mockRejectedValueOnce(error)
    await expect(getAthleteStatistics(165)).rejects.toBe(error)
  })
})
