import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import { useCreateTournament, useCreateGroup, useGroupsQuery } from './queries'
import type { Tournament } from './types'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('group queries', () => {
  it('creates a group and lists it for the tournament', async () => {
    // Groups still live in the mock store, which never validates that the tournamentId
    // it is handed actually exists — so a real tournament isn't needed here.
    vi.spyOn(sportsApi, 'createTournament').mockResolvedValue({ id: 502 } as Tournament)
    const create = renderHook(() => useCreateTournament(), { wrapper })
    const t = await create.result.current.mutateAsync({ name: 'Copa G', seasonId: 1, format: 'GROUP_STAGE' })
    const group = renderHook(() => useCreateGroup(), { wrapper })
    await group.result.current.mutateAsync({ tournamentId: t.id, name: 'Grupo A' })
    const list = renderHook(() => useGroupsQuery(t.id), { wrapper })
    await waitFor(() => expect(list.result.current.data?.some((g) => g.name === 'Grupo A')).toBe(true))
  })
})
