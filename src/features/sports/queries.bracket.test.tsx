import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import { useCreateTournament, useCreateBracketRound, useCreateBracketSlot, useBracketSlotsQuery } from './queries'
import type { Tournament } from './types'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('bracket queries', () => {
  it('creates a slot and lists it', async () => {
    // The bracket itself still lives in the mock store, which never validates that the
    // tournamentId it is handed actually exists — so a real tournament isn't needed here.
    vi.spyOn(sportsApi, 'createTournament').mockResolvedValue({ id: 501 } as Tournament)
    const create = renderHook(() => useCreateTournament(), { wrapper })
    const t = await create.result.current.mutateAsync({ name: 'Copa K', seasonId: 1, format: 'KNOCKOUT' })
    const round = renderHook(() => useCreateBracketRound(), { wrapper })
    const createdRound = await round.result.current.mutateAsync({ tournamentId: t.id, label: 'Final' })
    const slot = renderHook(() => useCreateBracketSlot(), { wrapper })
    await slot.result.current.mutateAsync({ tournamentId: t.id, roundId: createdRound.id, label: 'Final' })
    const list = renderHook(() => useBracketSlotsQuery(t.id), { wrapper })
    await waitFor(() => expect(list.result.current.data?.some((s) => s.label === 'Final')).toBe(true))
  })
})
