import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCreateTournament, useCreateBracketSlot, useBracketSlotsQuery } from './queries'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('bracket queries', () => {
  it('creates a slot and lists it', async () => {
    const create = renderHook(() => useCreateTournament(), { wrapper })
    const t = await create.result.current.mutateAsync({ name: 'Copa K', seasonId: 'season-2025-26', categoryId: null, format: 'KNOCKOUT', startDate: '2026-02-01', endDate: '2026-06-01' })
    const slot = renderHook(() => useCreateBracketSlot(), { wrapper })
    await slot.result.current.mutateAsync({ tournamentId: t.id, roundNumber: 1, label: 'Final' })
    const list = renderHook(() => useBracketSlotsQuery(t.id), { wrapper })
    await waitFor(() => expect(list.result.current.data?.some((s) => s.label === 'Final')).toBe(true))
  })
})
