import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSeasonsInfiniteQuery, useSeasonsQuery, useTeamsQuery, useAthletesQuery } from './queries'
import * as sportsApi from '../../services/sportsApi'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

afterEach(() => vi.restoreAllMocks())

const season = { id: 3, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' as const }

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
