import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import { useAddRosterEntry, useRemoveRosterEntry, useRosterQuery, useUpdateRosterEntry } from './queries'
import type { TournamentRoster } from './types'

/** One client per test, shared by every renderHook call in it — invalidation only
 *  crosses hooks that share a QueryClient instance. */
function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => vi.restoreAllMocks())

const roster88: TournamentRoster = {
  id: 88, tournamentId: 12, tournamentTeamId: 41, userId: 165, role: 'ATHLETE',
  jerseyNumber: 4, displayNameSnapshot: 'Rafael Moura',
}

describe('roster queries', () => {
  it('loads the roster for a registration', async () => {
    vi.spyOn(sportsApi, 'getTournamentRoster').mockResolvedValue([roster88])
    const list = renderHook(() => useRosterQuery(41), { wrapper: makeWrapper() })
    await waitFor(() => expect(list.result.current.data).toEqual([roster88]))
    expect(sportsApi.getTournamentRoster).toHaveBeenCalledWith(41)
  })

  it('stays disabled without a registration id', () => {
    const getTournamentRoster = vi.spyOn(sportsApi, 'getTournamentRoster').mockResolvedValue([])
    const list = renderHook(() => useRosterQuery(undefined), { wrapper: makeWrapper() })
    expect(list.result.current.fetchStatus).toBe('idle')
    expect(getTournamentRoster).not.toHaveBeenCalled()
  })

  it('refetches the same registration roster after adding a member', async () => {
    const getTournamentRoster = vi.spyOn(sportsApi, 'getTournamentRoster')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([roster88])
    vi.spyOn(sportsApi, 'addTournamentRoster').mockResolvedValue(roster88)

    const wrapper = makeWrapper()
    const list = renderHook(() => useRosterQuery(41), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([]))

    const add = renderHook(() => useAddRosterEntry(), { wrapper })
    await add.result.current.mutateAsync({ userId: 165, tournamentTeamId: 41, role: 'ATHLETE' })

    expect(sportsApi.addTournamentRoster).toHaveBeenCalledWith({ userId: 165, tournamentTeamId: 41, role: 'ATHLETE' })
    await waitFor(() => expect(list.result.current.data).toEqual([roster88]))
    expect(getTournamentRoster).toHaveBeenCalledTimes(2)
  })

  it('refetches the same registration roster after updating a member', async () => {
    const updated = { ...roster88, jerseyNumber: 23 }
    vi.spyOn(sportsApi, 'getTournamentRoster').mockResolvedValueOnce([roster88]).mockResolvedValueOnce([updated])
    vi.spyOn(sportsApi, 'updateTournamentRoster').mockResolvedValue(updated)

    const wrapper = makeWrapper()
    const list = renderHook(() => useRosterQuery(41), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([roster88]))

    const update = renderHook(() => useUpdateRosterEntry(), { wrapper })
    await update.result.current.mutateAsync({ id: 88, tournamentTeamId: 41, input: { jerseyNumber: 23 } })

    expect(sportsApi.updateTournamentRoster).toHaveBeenCalledWith(88, { jerseyNumber: 23 })
    await waitFor(() => expect(list.result.current.data).toEqual([updated]))
  })

  it('refetches the same registration roster after removing a member', async () => {
    vi.spyOn(sportsApi, 'getTournamentRoster').mockResolvedValueOnce([roster88]).mockResolvedValueOnce([])
    vi.spyOn(sportsApi, 'removeTournamentRoster').mockResolvedValue(undefined)

    const wrapper = makeWrapper()
    const list = renderHook(() => useRosterQuery(41), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([roster88]))

    const remove = renderHook(() => useRemoveRosterEntry(), { wrapper })
    await remove.result.current.mutateAsync({ id: 88, tournamentTeamId: 41 })

    expect(sportsApi.removeTournamentRoster).toHaveBeenCalledWith(88)
    await waitFor(() => expect(list.result.current.data).toEqual([]))
  })
})
