import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  bracketKeys,
  matchKeys,
  standingsKeys,
  tournamentKeys,
  useCancelMatch,
  useCreateMatch,
  useLinkBracketSlotMatch,
  usePostponeMatch,
  useMatchesInfiniteQuery,
  useSeasonsInfiniteQuery,
  useSeasonsQuery,
  useSetBracketSlotWinner,
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
