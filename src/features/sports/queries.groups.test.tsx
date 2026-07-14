import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCreateTournament, useCreateGroup, useGroupsQuery, useEnrollTeam, useAssignTeamToGroup, useStandingsQuery } from './queries'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('group queries', () => {
  it('creates a group and lists it for the tournament', async () => {
    const create = renderHook(() => useCreateTournament(), { wrapper })
    const t = await create.result.current.mutateAsync({ name: 'Copa G', seasonId: 'season-2025-26', categoryId: null, format: 'GROUP_STAGE', startDate: '2026-02-01', endDate: '2026-06-01' })
    const group = renderHook(() => useCreateGroup(), { wrapper })
    await group.result.current.mutateAsync({ tournamentId: t.id, name: 'Grupo A' })
    const list = renderHook(() => useGroupsQuery(t.id), { wrapper })
    await waitFor(() => expect(list.result.current.data?.some((g) => g.name === 'Grupo A')).toBe(true))
  })

  it('returns one standings envelope per group, EMPTY before any result', async () => {
    const create = renderHook(() => useCreateTournament(), { wrapper })
    const t = await create.result.current.mutateAsync({ name: 'Copa H', seasonId: 'season-2025-26', categoryId: null, format: 'GROUP_STAGE', startDate: '2026-02-01', endDate: '2026-06-01' })
    await renderHook(() => useEnrollTeam(), { wrapper }).result.current.mutateAsync({ tournamentId: t.id, teamId: 'puc-time-1', displayName: 'Alfa' })
    const group = await renderHook(() => useCreateGroup(), { wrapper }).result.current.mutateAsync({ tournamentId: t.id, name: 'Grupo A' })
    await renderHook(() => useAssignTeamToGroup(), { wrapper }).result.current.mutateAsync({ tournamentId: t.id, groupId: group.id, teamId: 'puc-time-1' })

    const standings = renderHook(() => useStandingsQuery(t.id), { wrapper })
    await waitFor(() => expect(standings.result.current.data?.[0]?.standingsState).toBe('EMPTY'))
    expect(standings.result.current.data?.[0].rows[0].position).toBeNull()
  })
})
