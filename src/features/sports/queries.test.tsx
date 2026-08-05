import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  athleteKeys,
  bracketKeys,
  matchKeys,
  standingsKeys,
  tournamentKeys,
  useAthleteMatchesInfiniteQuery,
  useAthleteQuery,
  useAthleteStatisticsQuery,
  useAthleteTournamentsInfiniteQuery,
  useCancelMatch,
  useCreateMatch,
  useLinkBracketSlotMatch,
  usePostponeMatch,
  useMatchesInfiniteQuery,
  useReopenMatch,
  useSaveMatchDraft,
  useSeasonsInfiniteQuery,
  useSeasonsQuery,
  useSetBracketSlotWinner,
  useSubmitMatchResult,
  useTeamsQuery,
  useAthletesQuery,
  useTournamentMatchesQuery,
  useUnlinkBracketSlotMatch,
  useUpdateMatch,
} from './queries'
import * as sportsApi from '../../services/sportsApi'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, Wrapper }
}

/**
 * `renderHook` result snapshots don't reliably reflect an infinite query's merged
 * pages right after a bare `fetchNextPage()` — the commit lands on a later tick than
 * `waitFor`'s own polling flushes. Polling inside `act()` forces that tick each time.
 */
async function waitForPageCount(getResult: () => { data?: { pages: unknown[] } }, count: number) {
  for (let attempt = 0; attempt < 30 && (getResult().data?.pages.length ?? 0) < count; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
  }
}

afterEach(() => vi.restoreAllMocks())

const apiFailure = (code: string, message = 'failure') =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { data: { error: { code, message } } },
  })

const season = { id: 3, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' as const }

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

const bracketSlotRow = {
  id: 71, tournamentId: 12, roundId: 10, position: 2, label: null,
  homeTournamentTeamId: 23, awayTournamentTeamId: null, matchId: 501, winnerTournamentTeamId: null,
}

const firstPage = {
  data: [matchSummary],
  meta: { totalItems: 2, itemCount: 1, itemsPerPage: 20, totalPages: 2, currentPage: 1 },
  links: { first: '/matches?page=1', previous: null, next: '/matches?page=2', last: '/matches?page=2' },
  statusCode: 200,
}

const lastPage = {
  data: [{ ...matchSummary, id: 502 }],
  meta: { totalItems: 2, itemCount: 1, itemsPerPage: 20, totalPages: 2, currentPage: 2 },
  links: { first: '/matches?page=1', previous: '/matches?page=1', next: null, last: '/matches?page=2' },
  statusCode: 200,
}

const firstTournamentPage = {
  data: [matchSummary],
  meta: { totalItems: 2, itemCount: 1, itemsPerPage: 100, totalPages: 2, currentPage: 1 },
  links: { first: '/tournaments/31/matches?page=1', previous: null, next: '/tournaments/31/matches?page=2', last: '/tournaments/31/matches?page=2' },
  statusCode: 200,
}

const lastTournamentPage = {
  data: [{ ...matchSummary, id: 502 }],
  meta: { totalItems: 2, itemCount: 1, itemsPerPage: 100, totalPages: 2, currentPage: 2 },
  links: { first: '/tournaments/31/matches?page=1', previous: '/tournaments/31/matches?page=1', next: null, last: '/tournaments/31/matches?page=2' },
  statusCode: 200,
}

describe('season queries', () => {
  it('forwards the status filter to the seasons catalog', async () => {
    const getSeasons = vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    const list = renderHook(() => useSeasonsQuery({ status: 'ACTIVE' }), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([season]))
    expect(getSeasons).toHaveBeenCalledWith({ status: 'ACTIVE' })
  })

  it('stops paging when the last page was loaded', async () => {
    vi.spyOn(sportsApi, 'listSeasonsPage').mockResolvedValue({
      data: [season],
      meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
      links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
      statusCode: 200,
    })
    const list = renderHook(() => useSeasonsInfiniteQuery({ q: '', status: '' }), { wrapper })
    await waitFor(() => expect(list.result.current.hasNextPage).toBe(false))
  })
})

describe('catalog queries', () => {
  it('loads teams through React Query', async () => {
    vi.spyOn(sportsApi, 'getTeams').mockResolvedValue([{ id: 1, name: 'Time 1', shortName: 'T01', city: 'Campinas' }])
    const list = renderHook(() => useTeamsQuery(), { wrapper })
    await waitFor(() => expect(list.result.current.data?.[0]?.shortName).toBe('T01'))
  })

  it('loads athletes through React Query', async () => {
    const list = renderHook(() => useAthletesQuery(), { wrapper })
    await waitFor(() => expect(list.result.current.data?.[0]?.name).toBe('Rafael Moura'))
  })
})

const athleteProfile = {
  id: 165,
  name: 'Current Athlete',
  currentTeamId: null,
  jerseyNumber: null,
  position: null,
  status: 'INACTIVE' as const,
}

const metricCounts = {
  minutesSeconds: 0, pts: 2, reb: 0, ast: 2, stl: 2, blk: 2, tov: 2, pf: 2,
  fgm: 2, fga: 2, threeFgm: 2, threeFga: 2, ftm: 2, fta: 2,
}

const metricValues = {
  minutesSeconds: null, pts: 0, reb: null, ast: 3, stl: 0, blk: 0, tov: 1, pf: 2,
  fgm: 8, fga: 6, threeFgm: 2, threeFga: 1, ftm: 4, fta: 3,
}

const athleteStatistics = {
  gamesPlayed: 3,
  measuredGames: metricCounts,
  totals: metricValues,
  perGame: { ...metricValues, ast: 1.5 },
  shooting: { fgPct: 1.333, threeFgPct: 2, ftPct: 1.333, trueShootingPct: 1.4 },
  efficiency: { measuredGames: 2, total: 7, perGame: 3.5 },
}

describe('athlete profile and statistics queries', () => {
  it('uses separate detail and statistics cache keys', async () => {
    vi.spyOn(sportsApi, 'getAthlete').mockResolvedValue(athleteProfile)
    vi.spyOn(sportsApi, 'getAthleteStatistics').mockResolvedValue(athleteStatistics)

    const detail = renderHook(() => useAthleteQuery(165), { wrapper })
    const statistics = renderHook(() => useAthleteStatisticsQuery(165), { wrapper })

    await waitFor(() => expect(detail.result.current.data).toEqual(athleteProfile))
    await waitFor(() => expect(statistics.result.current.data).toEqual(athleteStatistics))
    expect(athleteKeys.detail(165)).toEqual(['athletes', 'detail', 165])
    expect(athleteKeys.statistics(165)).toEqual(['athletes', 'statistics', 165])
  })

  it('does not request statistics while its tab is disabled', () => {
    const getStatistics = vi.spyOn(sportsApi, 'getAthleteStatistics')
    renderHook(() => useAthleteStatisticsQuery(165, false), { wrapper })
    expect(getStatistics).not.toHaveBeenCalled()
  })
})

const athleteMatchRow = {
  match: { id: 501, scheduledAt: '2026-08-15T19:30:00.000Z' },
  tournament: { id: 12, name: 'Intercourses 2026' },
  athleteName: 'Historical Athlete',
  team: { tournamentTeamId: 41, teamId: 8, name: 'Historical Team' },
  opponent: { tournamentTeamId: 52, teamId: 15, name: 'Historical Opponent' },
  result: { result: 'LOSS' as const, lossType: 'FORFEIT' as const, pointsFor: 0, pointsAgainst: 20 },
  stats: {
    tournamentRosterId: 88,
    minutesSeconds: null, pts: 0, reb: null, ast: 3, stl: 0, blk: 0, tov: 1, pf: 2,
    fgm: 8, fga: 6, threeFgm: 2, threeFga: 1, ftm: 4, fta: 3,
  },
  derived: { fgPct: 1.333, threeFgPct: 2, ftPct: 1.333, trueShootingPct: 1.4, efficiency: null },
}

const athleteMatchPage = (id: number, currentPage: number, totalPages: number) => ({
  data: [{ ...athleteMatchRow, match: { ...athleteMatchRow.match, id } }],
  meta: { totalItems: 2, itemCount: 1, itemsPerPage: 20, totalPages, currentPage },
  links: { first: '?page=1', previous: currentPage === 1 ? null : '?page=1', next: currentPage < totalPages ? '?page=2' : null, last: `?page=${totalPages}` },
  statusCode: 200,
})

describe('athlete match history query', () => {
  it('keeps filters in the key and requests successive pages of twenty', async () => {
    vi.spyOn(sportsApi, 'listAthleteMatchesPage')
      .mockResolvedValueOnce(athleteMatchPage(501, 1, 2))
      .mockResolvedValueOnce(athleteMatchPage(502, 2, 2))
    const filters = { ids: [501, 502], tournamentId: 12 }
    const { result } = renderHook(
      () => useAthleteMatchesInfiniteQuery(165, filters),
      { wrapper },
    )

    await waitForPageCount(() => result.current, 1)
    await act(async () => {
      await result.current.fetchNextPage()
    })
    await waitForPageCount(() => result.current, 2)

    expect(athleteKeys.matches(165, filters)).toEqual(['athletes', 'matches', 165, 20, filters])
    expect(sportsApi.listAthleteMatchesPage).toHaveBeenNthCalledWith(1, 165, {
      ids: [501, 502], tournamentId: 12, page: 1, limit: 20,
    })
    expect(sportsApi.listAthleteMatchesPage).toHaveBeenNthCalledWith(2, 165, {
      ids: [501, 502], tournamentId: 12, page: 2, limit: 20,
    })
    expect(result.current.data?.pages.flatMap((page) => page.data).map((row) => row.match.id))
      .toEqual([501, 502])
    expect(result.current.hasNextPage).toBe(false)
  })

  it('does not request match history while its tab is disabled', () => {
    const listMatches = vi.spyOn(sportsApi, 'listAthleteMatchesPage')
    renderHook(() => useAthleteMatchesInfiniteQuery(165, {}, false), { wrapper })
    expect(listMatches).not.toHaveBeenCalled()
  })
})

const athleteTournamentRow = {
  tournament: { id: 12, name: 'Historical Cup', seasonId: 7, startsAt: null },
  team: { tournamentTeamId: 41, teamId: 8, name: 'Historical Team' },
  statistics: athleteStatistics,
}

const athleteTournamentPage = (tournamentTeamId: number, currentPage: number, totalPages: number) => ({
  data: [{ ...athleteTournamentRow, team: { ...athleteTournamentRow.team, tournamentTeamId } }],
  meta: { totalItems: 2, itemCount: 1, itemsPerPage: 20, totalPages, currentPage },
  links: { first: '?page=1', previous: currentPage === 1 ? null : '?page=1', next: currentPage < totalPages ? '?page=2' : null, last: `?page=${totalPages}` },
  statusCode: 200,
})

describe('athlete tournament history query', () => {
  it('keeps filters in the key and appends successive pages of twenty', async () => {
    vi.spyOn(sportsApi, 'listAthleteTournamentsPage')
      .mockResolvedValueOnce(athleteTournamentPage(41, 1, 2))
      .mockResolvedValueOnce(athleteTournamentPage(42, 2, 2))
    const filters = { ids: [12], seasonId: 7 }
    const { result } = renderHook(
      () => useAthleteTournamentsInfiniteQuery(165, filters),
      { wrapper },
    )

    await waitForPageCount(() => result.current, 1)
    await act(async () => {
      await result.current.fetchNextPage()
    })
    await waitForPageCount(() => result.current, 2)

    expect(athleteKeys.tournaments(165, filters)).toEqual(['athletes', 'tournaments', 165, 20, filters])
    expect(sportsApi.listAthleteTournamentsPage).toHaveBeenNthCalledWith(1, 165, {
      ids: [12], seasonId: 7, page: 1, limit: 20,
    })
    expect(sportsApi.listAthleteTournamentsPage).toHaveBeenNthCalledWith(2, 165, {
      ids: [12], seasonId: 7, page: 2, limit: 20,
    })
    expect(result.current.data?.pages.flatMap((page) => page.data).map((row) => row.team.tournamentTeamId))
      .toEqual([41, 42])
  })

  it('does not request tournament history while its tab is disabled', () => {
    const listTournaments = vi.spyOn(sportsApi, 'listAthleteTournamentsPage')
    renderHook(() => useAthleteTournamentsInfiniteQuery(165, {}, false), { wrapper })
    expect(listTournaments).not.toHaveBeenCalled()
  })
})

describe('match queries', () => {
  it('keeps global filters in the infinite query key and requests pages of twenty', async () => {
    vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValueOnce(firstPage).mockResolvedValueOnce(lastPage)
    const { result } = renderHook(() => useMatchesInfiniteQuery({ q: 'Águias', status: 'SCHEDULED' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await result.current.fetchNextPage()
    expect(sportsApi.listMatchesPage).toHaveBeenLastCalledWith({ q: 'Águias', status: 'SCHEDULED', page: 2, limit: 20 })
  })

  it('collects every tournament page with a limit of one hundred', async () => {
    vi.spyOn(sportsApi, 'listTournamentMatchesPage').mockResolvedValueOnce(firstTournamentPage).mockResolvedValueOnce(lastTournamentPage)
    const { result } = renderHook(() => useTournamentMatchesQuery(31), { wrapper })
    await waitFor(() => expect(result.current.data).toHaveLength(2))
    expect(sportsApi.listTournamentMatchesPage).toHaveBeenLastCalledWith(31, { page: 2, limit: 100 })
  })

  it('retries a concurrent update exactly once', async () => {
    vi.spyOn(sportsApi, 'updateMatch').mockRejectedValueOnce(apiFailure('CONCURRENT_MODIFICATION')).mockResolvedValueOnce(matchDetail)
    const { result } = renderHook(() => useUpdateMatch(), { wrapper })
    result.current.mutate({ id: 501, input: { venueName: 'Quadra 2' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sportsApi.updateMatch).toHaveBeenCalledTimes(2)
  })

  it('does not retry an invalid status transition', async () => {
    vi.spyOn(sportsApi, 'postponeMatch').mockRejectedValue(apiFailure('INVALID_STATUS_TRANSITION'))
    const { result } = renderHook(() => usePostponeMatch(), { wrapper })
    result.current.mutate(501)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(sportsApi.postponeMatch).toHaveBeenCalledTimes(1)
  })

  it('invalidates match lists, the tournament match list, the tournament detail and standings after create', async () => {
    vi.spyOn(sportsApi, 'createMatch').mockResolvedValue(matchDetail)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateMatch(), { wrapper: Wrapper })
    result.current.mutate({
      tournamentId: matchDetail.tournamentId,
      scheduledAt: matchDetail.scheduledAt,
      homeTournamentTeamId: matchDetail.homeTeam.tournamentTeamId,
      awayTournamentTeamId: matchDetail.awayTeam.tournamentTeamId,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      matchKeys.lists(),
      matchKeys.tournamentLists(matchDetail.tournamentId),
      tournamentKeys.detail(matchDetail.tournamentId),
      standingsKeys.list(matchDetail.tournamentId),
    ])
  })

  it('writes the match detail cache after update', async () => {
    vi.spyOn(sportsApi, 'updateMatch').mockResolvedValue(matchDetail)
    const { client, Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateMatch(), { wrapper: Wrapper })
    result.current.mutate({ id: matchDetail.id, input: { venueName: 'Quadra 2' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(matchKeys.detail(matchDetail.id))).toEqual(matchDetail)
  })

  it('invalidates lists, tournament matches, tournament detail, standings and bracket after update', async () => {
    vi.spyOn(sportsApi, 'updateMatch').mockResolvedValue(matchDetail)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateMatch(), { wrapper: Wrapper })
    result.current.mutate({ id: matchDetail.id, input: { venueName: 'Quadra 2' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      matchKeys.lists(),
      matchKeys.tournamentLists(matchDetail.tournamentId),
      tournamentKeys.detail(matchDetail.tournamentId),
      standingsKeys.list(matchDetail.tournamentId),
      bracketKeys.list(matchDetail.tournamentId),
    ])
  })

  it('writes the match detail cache after postpone', async () => {
    const postponed = { ...matchDetail, status: 'POSTPONED' as const }
    vi.spyOn(sportsApi, 'postponeMatch').mockResolvedValue(postponed)
    const { client, Wrapper } = createWrapper()
    const { result } = renderHook(() => usePostponeMatch(), { wrapper: Wrapper })
    result.current.mutate(matchDetail.id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(matchKeys.detail(matchDetail.id))).toEqual(postponed)
  })

  it('writes the match detail cache after cancel', async () => {
    const cancelled = { ...matchDetail, status: 'CANCELLED' as const }
    vi.spyOn(sportsApi, 'cancelMatch').mockResolvedValue(cancelled)
    const { client, Wrapper } = createWrapper()
    const { result } = renderHook(() => useCancelMatch(), { wrapper: Wrapper })
    result.current.mutate(matchDetail.id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(matchKeys.detail(matchDetail.id))).toEqual(cancelled)
  })

  it('forwards a complete draft snapshot to the adapter', async () => {
    const input = {
      periods: [
        {
          periodNumber: 1,
          periodType: 'REGULAR' as const,
          homePoints: 18,
          awayPoints: 22,
        },
      ],
      playerStats: [],
      mvpTournamentRosterId: null,
    }
    const saveMatchDraft = vi
      .spyOn(sportsApi, 'saveMatchDraft')
      .mockResolvedValue({ ...matchDetail, status: 'LIVE' })
    const { result } = renderHook(() => useSaveMatchDraft(), { wrapper })

    result.current.mutate({ id: 501, input })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(saveMatchDraft).toHaveBeenCalledWith(501, input)
  })

  it('retries a concurrent result submission exactly once', async () => {
    const input = {
      resultType: 'NORMAL' as const,
      periods: [
        {
          periodNumber: 1,
          periodType: 'REGULAR' as const,
          homePoints: 18,
          awayPoints: 15,
        },
      ],
      playerStats: [],
      mvpTournamentRosterId: null,
    }
    const submitMatchResult = vi
      .spyOn(sportsApi, 'submitMatchResult')
      .mockRejectedValueOnce(apiFailure('CONCURRENT_MODIFICATION'))
      .mockResolvedValueOnce({ ...matchDetail, status: 'FINISHED' })
    const { result } = renderHook(() => useSubmitMatchResult(), { wrapper })

    result.current.mutate({ id: 501, input })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(submitMatchResult).toHaveBeenCalledTimes(2)
  })

  it('does not retry a result validation error', async () => {
    const submitMatchResult = vi
      .spyOn(sportsApi, 'submitMatchResult')
      .mockRejectedValue(apiFailure('INVALID_MATCH_PERIODS'))
    const { result } = renderHook(() => useSubmitMatchResult(), { wrapper })

    result.current.mutate({
      id: 501,
      input: {
        resultType: 'NORMAL',
        periods: [],
        playerStats: [],
        mvpTournamentRosterId: null,
      },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(submitMatchResult).toHaveBeenCalledTimes(1)
  })

  it('forwards reopen using only the match id', async () => {
    const reopenMatch = vi
      .spyOn(sportsApi, 'reopenMatch')
      .mockResolvedValue({ ...matchDetail, status: 'LIVE' })
    const { result } = renderHook(() => useReopenMatch(), { wrapper })

    result.current.mutate(501)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(reopenMatch).toHaveBeenCalledWith(501)
  })

  it('writes the returned draft detail and invalidates every affected read', async () => {
    const liveMatch = { ...matchDetail, status: 'LIVE' as const }
    vi.spyOn(sportsApi, 'saveMatchDraft').mockResolvedValue(liveMatch)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSaveMatchDraft(), {
      wrapper: Wrapper,
    })

    result.current.mutate({ id: 501, input: {} })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(matchKeys.detail(501))).toEqual(liveMatch)
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      matchKeys.lists(),
      matchKeys.tournamentLists(matchDetail.tournamentId),
      tournamentKeys.detail(matchDetail.tournamentId),
      standingsKeys.list(matchDetail.tournamentId),
      bracketKeys.list(matchDetail.tournamentId),
    ])
  })

  it('writes the returned result detail and invalidates every affected read', async () => {
    const finishedMatch = { ...matchDetail, status: 'FINISHED' as const }
    vi.spyOn(sportsApi, 'submitMatchResult').mockResolvedValue(finishedMatch)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSubmitMatchResult(), {
      wrapper: Wrapper,
    })

    result.current.mutate({
      id: 501,
      input: {
        resultType: 'FORFEIT',
        offendingTournamentTeamId: 52,
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(matchKeys.detail(501))).toEqual(finishedMatch)
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      matchKeys.lists(),
      matchKeys.tournamentLists(matchDetail.tournamentId),
      tournamentKeys.detail(matchDetail.tournamentId),
      standingsKeys.list(matchDetail.tournamentId),
      bracketKeys.list(matchDetail.tournamentId),
    ])
  })

  it('writes the reopened detail and invalidates every affected read', async () => {
    const liveMatch = { ...matchDetail, status: 'LIVE' as const }
    vi.spyOn(sportsApi, 'reopenMatch').mockResolvedValue(liveMatch)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useReopenMatch(), { wrapper: Wrapper })

    result.current.mutate(501)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(matchKeys.detail(501))).toEqual(liveMatch)
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      matchKeys.lists(),
      matchKeys.tournamentLists(matchDetail.tournamentId),
      tournamentKeys.detail(matchDetail.tournamentId),
      standingsKeys.list(matchDetail.tournamentId),
      bracketKeys.list(matchDetail.tournamentId),
    ])
  })

  it('invalidates the stale match reads after a second concurrency failure', async () => {
    vi.spyOn(sportsApi, 'saveMatchDraft').mockRejectedValue(
      apiFailure('CONCURRENT_MODIFICATION'),
    )
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSaveMatchDraft(), {
      wrapper: Wrapper,
    })

    result.current.mutate({ id: 501, input: {} })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(sportsApi.saveMatchDraft).toHaveBeenCalledTimes(2)
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      matchKeys.detail(501),
      matchKeys.lists(),
    ])
  })
})

describe('bracket match link', () => {
  it('links a match by sending only the match id', async () => {
    vi.spyOn(sportsApi, 'linkBracketSlotMatch').mockResolvedValue(bracketSlotRow)
    const { result } = renderHook(() => useLinkBracketSlotMatch(), { wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sportsApi.linkBracketSlotMatch).toHaveBeenCalledWith(71, { matchId: 501 })
  })

  it('retries a concurrent link exactly once', async () => {
    vi.spyOn(sportsApi, 'linkBracketSlotMatch').mockRejectedValueOnce(apiFailure('CONCURRENT_MODIFICATION')).mockResolvedValueOnce(bracketSlotRow)
    const { result } = renderHook(() => useLinkBracketSlotMatch(), { wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sportsApi.linkBracketSlotMatch).toHaveBeenCalledTimes(2)
  })

  it('invalidates the bracket, match lists, match detail and tournament after linking', async () => {
    vi.spyOn(sportsApi, 'linkBracketSlotMatch').mockResolvedValue(bracketSlotRow)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useLinkBracketSlotMatch(), { wrapper: Wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      bracketKeys.list(12),
      matchKeys.lists(),
      matchKeys.detail(501),
      tournamentKeys.detail(12),
    ])
  })

  it('unlinks a match using only the slot id', async () => {
    vi.spyOn(sportsApi, 'unlinkBracketSlotMatch').mockResolvedValue(undefined)
    const { result } = renderHook(() => useUnlinkBracketSlotMatch(), { wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sportsApi.unlinkBracketSlotMatch).toHaveBeenCalledWith(71)
  })

  it('invalidates the bracket, match lists, match detail and tournament after a second concurrent unlink failure', async () => {
    vi.spyOn(sportsApi, 'unlinkBracketSlotMatch').mockRejectedValue(apiFailure('CONCURRENT_MODIFICATION'))
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUnlinkBracketSlotMatch(), { wrapper: Wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501 })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(sportsApi.unlinkBracketSlotMatch).toHaveBeenCalledTimes(2)
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      bracketKeys.list(12),
      matchKeys.lists(),
      matchKeys.detail(501),
      tournamentKeys.detail(12),
    ])
  })

  it('leaves the cache alone when the unlink is refused for a reason other than concurrency', async () => {
    vi.spyOn(sportsApi, 'unlinkBracketSlotMatch').mockRejectedValue(apiFailure('MATCH_ALREADY_FINISHED'))
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUnlinkBracketSlotMatch(), { wrapper: Wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501 })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe('bracket slot winner', () => {
  it('sends a numeric winner as the request body', async () => {
    vi.spyOn(sportsApi, 'setBracketSlotWinner').mockResolvedValue(bracketSlotRow)
    const { result } = renderHook(() => useSetBracketSlotWinner(), { wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501, winnerTournamentTeamId: 41 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sportsApi.setBracketSlotWinner).toHaveBeenCalledWith(71, { winnerTournamentTeamId: 41 })
  })

  it('sends null as a present key to clear the winner', async () => {
    vi.spyOn(sportsApi, 'setBracketSlotWinner').mockResolvedValue({ ...bracketSlotRow, winnerTournamentTeamId: null })
    const { result } = renderHook(() => useSetBracketSlotWinner(), { wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501, winnerTournamentTeamId: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sportsApi.setBracketSlotWinner).toHaveBeenCalledWith(71, { winnerTournamentTeamId: null })
  })

  it('retries a concurrent winner write exactly once', async () => {
    vi.spyOn(sportsApi, 'setBracketSlotWinner').mockRejectedValueOnce(apiFailure('CONCURRENT_MODIFICATION')).mockResolvedValueOnce(bracketSlotRow)
    const { result } = renderHook(() => useSetBracketSlotWinner(), { wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501, winnerTournamentTeamId: 41 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sportsApi.setBracketSlotWinner).toHaveBeenCalledTimes(2)
  })

  it('invalidates the bracket, tournament and embedded match after a successful write', async () => {
    vi.spyOn(sportsApi, 'setBracketSlotWinner').mockResolvedValue(bracketSlotRow)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSetBracketSlotWinner(), { wrapper: Wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501, winnerTournamentTeamId: 41 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      bracketKeys.list(12),
      tournamentKeys.detail(12),
      matchKeys.detail(501),
    ])
  })

  it('skips the match invalidation when the slot has no linked match', async () => {
    vi.spyOn(sportsApi, 'setBracketSlotWinner').mockResolvedValue(bracketSlotRow)
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSetBracketSlotWinner(), { wrapper: Wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: null, winnerTournamentTeamId: 41 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      bracketKeys.list(12),
      tournamentKeys.detail(12),
    ])
  })

  it('invalidates the bracket and tournament after a second concurrent failure', async () => {
    vi.spyOn(sportsApi, 'setBracketSlotWinner').mockRejectedValue(apiFailure('CONCURRENT_MODIFICATION'))
    const { client, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSetBracketSlotWinner(), { wrapper: Wrapper })
    result.current.mutate({ tournamentId: 12, slotId: 71, matchId: 501, winnerTournamentTeamId: 41 })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(sportsApi.setBracketSlotWinner).toHaveBeenCalledTimes(2)
    expect(invalidateSpy.mock.calls.map(([arg]) => arg!.queryKey)).toEqual([
      bracketKeys.list(12),
      tournamentKeys.detail(12),
      matchKeys.detail(501),
    ])
  })
})
