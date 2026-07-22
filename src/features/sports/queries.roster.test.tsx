import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useAddRosterEntry,
  useCreateTournament,
  useEnrollTeam,
  useRemoveRosterEntry,
  useRosterQuery,
  useUpdateRosterEntry,
} from './queries'

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

describe('roster mutation hooks', () => {
  it('updates and removes an entry, invalidating the active roster query after each mutation', async () => {
    const tournament = await renderHook(() => useCreateTournament(), { wrapper }).result.current.mutateAsync({
      name: 'Copa R',
      seasonId: 1,
      categoryId: null,
      format: 'LEAGUE',
      startDate: '2026-02-01',
      endDate: '2026-06-01',
    })
    await renderHook(() => useEnrollTeam(), { wrapper }).result.current.mutateAsync({
      tournamentId: tournament.id,
      teamId: 1,
      displayName: 'Tigres',
    })
    const entry = await renderHook(() => useAddRosterEntry(), { wrapper }).result.current.mutateAsync({
      tournamentId: tournament.id,
      teamId: 1,
      athleteId: 109,
      jerseyNumber: 7,
      role: 'ATHLETE',
    })
    const list = renderHook(() => useRosterQuery(tournament.id, 1), { wrapper })
    await waitFor(() => expect(list.result.current.data?.[0]?.jerseyNumber).toBe(7))

    await renderHook(() => useUpdateRosterEntry(), { wrapper }).result.current.mutateAsync({
      id: entry.id,
      tournamentId: tournament.id,
      teamId: 1,
      input: { jerseyNumber: 23 },
    })
    await waitFor(() => expect(list.result.current.data?.[0]?.jerseyNumber).toBe(23))

    await renderHook(() => useRemoveRosterEntry(), { wrapper }).result.current.mutateAsync({
      id: entry.id,
      tournamentId: tournament.id,
      teamId: 1,
    })
    await waitFor(() => expect(list.result.current.data?.length).toBe(0))
  })
})
