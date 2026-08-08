import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import {
  teamProfileKeys,
  useTeamMatchesInfiniteQuery,
  useTeamRosterInfiniteQuery,
  useTeamSummaryQuery,
  useTeamTournamentsInfiniteQuery,
} from './queries'
import type { TeamSummary } from './types'

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => vi.restoreAllMocks())

const summary: TeamSummary = {
  team: { id: 8, name: 'Engenharia PUC', shortName: 'EPU', city: 'Campinas', state: 'SP', status: 'ACTIVE' },
  titles: [],
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

const page = <T,>(data: T[], currentPage = 1, totalPages = 1) => ({
  data,
  meta: { totalItems: data.length, itemCount: data.length, itemsPerPage: 20, totalPages, currentPage },
  links: {
    first: '?page=1',
    previous: currentPage === 1 ? null : '?page=1',
    next: currentPage < totalPages ? '?page=2' : null,
    last: `?page=${totalPages}`,
  },
  statusCode: 200,
})

describe('team profile query keys', () => {
  it('separates the two match scopes', () => {
    expect(teamProfileKeys.matches(8, 'upcoming')).not.toEqual(teamProfileKeys.matches(8, 'history'))
  })

  it('separates the two roster roles', () => {
    expect(teamProfileKeys.roster(8, 'ATHLETE')).not.toEqual(teamProfileKeys.roster(8, 'COACHING_STAFF'))
  })
})

describe('team profile queries', () => {
  it('loads the summary as soon as a valid id is available', async () => {
    vi.spyOn(sportsApi, 'getTeamSummary').mockResolvedValue(summary)

    const { result } = renderHook(() => useTeamSummaryQuery(8), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(summary))
  })

  it('does not request the summary without an id', () => {
    const getSummary = vi.spyOn(sportsApi, 'getTeamSummary').mockResolvedValue(summary)

    renderHook(() => useTeamSummaryQuery(undefined), { wrapper: makeWrapper() })

    expect(getSummary).not.toHaveBeenCalled()
  })

  it('does not request matches while the tab is closed', () => {
    const listMatches = vi.spyOn(sportsApi, 'listTeamMatchesPage').mockResolvedValue(page([]))

    renderHook(() => useTeamMatchesInfiniteQuery(8, 'upcoming', false), { wrapper: makeWrapper() })

    expect(listMatches).not.toHaveBeenCalled()
  })

  it('requests the scope and page size of the enabled match section', async () => {
    const listMatches = vi.spyOn(sportsApi, 'listTeamMatchesPage').mockResolvedValue(page([]))

    renderHook(() => useTeamMatchesInfiniteQuery(8, 'history', true), { wrapper: makeWrapper() })

    await waitFor(() => expect(listMatches).toHaveBeenCalledWith(8, { scope: 'history', page: 1, limit: 20 }))
  })

  it('stops offering a next match page on the last page', async () => {
    vi.spyOn(sportsApi, 'listTeamMatchesPage').mockResolvedValue(page([], 1, 1))

    const { result } = renderHook(() => useTeamMatchesInfiniteQuery(8, 'upcoming', true), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
  })

  it('offers a next match page while pages remain', async () => {
    vi.spyOn(sportsApi, 'listTeamMatchesPage').mockResolvedValue(page([], 1, 3))

    const { result } = renderHook(() => useTeamMatchesInfiniteQuery(8, 'upcoming', true), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
  })

  it('does not request tournaments while the tab is closed', () => {
    const listTournaments = vi.spyOn(sportsApi, 'listTeamTournamentsPage').mockResolvedValue(page([]))

    renderHook(() => useTeamTournamentsInfiniteQuery(8, false), { wrapper: makeWrapper() })

    expect(listTournaments).not.toHaveBeenCalled()
  })

  it('requests the first tournament page when the tab opens', async () => {
    const listTournaments = vi.spyOn(sportsApi, 'listTeamTournamentsPage').mockResolvedValue(page([]))

    renderHook(() => useTeamTournamentsInfiniteQuery(8, true), { wrapper: makeWrapper() })

    await waitFor(() => expect(listTournaments).toHaveBeenCalledWith(8, { page: 1, limit: 20 }))
  })

  it('requests the roster catalog filtered by team and role', async () => {
    const listCandidates = vi.spyOn(sportsApi, 'listRosterCandidatesPage').mockResolvedValue(page([]))

    renderHook(() => useTeamRosterInfiniteQuery(8, 'COACHING_STAFF', true), { wrapper: makeWrapper() })

    await waitFor(() => expect(listCandidates).toHaveBeenCalledWith({
      teamId: 8, role: 'COACHING_STAFF', page: 1, limit: 20,
    }))
  })

  it('does not request the roster while the tab is closed', () => {
    const listCandidates = vi.spyOn(sportsApi, 'listRosterCandidatesPage').mockResolvedValue(page([]))

    renderHook(() => useTeamRosterInfiniteQuery(8, 'ATHLETE', false), { wrapper: makeWrapper() })

    expect(listCandidates).not.toHaveBeenCalled()
  })
})
