import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import {
  useAssignTeamToGroup,
  useCreateGroup,
  useGroupsQuery,
  useGroupTeamsQuery,
  useRemoveGroup,
  useRemoveGroupTeam,
  useUpdateGroup,
} from './queries'
import type { TournamentGroup, TournamentGroupTeam } from './types'

/** One client per test, shared by every renderHook call in it — invalidation only
 *  crosses hooks that share a QueryClient instance. */
function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => vi.restoreAllMocks())

const groupA: TournamentGroup = { id: 7, tournamentId: 12, name: 'Grupo A', sortOrder: 1 }
const membership31: TournamentGroupTeam = { id: 31, tournamentId: 12, tournamentGroupId: 7, tournamentTeamId: 41 }

describe('group queries', () => {
  it('loads groups for a tournament', async () => {
    vi.spyOn(sportsApi, 'getGroups').mockResolvedValue([groupA])
    const list = renderHook(() => useGroupsQuery(12), { wrapper: makeWrapper() })
    await waitFor(() => expect(list.result.current.data).toEqual([groupA]))
    expect(sportsApi.getGroups).toHaveBeenCalledWith(12)
  })

  it('stays disabled without a tournament id', () => {
    const getGroups = vi.spyOn(sportsApi, 'getGroups').mockResolvedValue([])
    const getGroupTeams = vi.spyOn(sportsApi, 'getGroupTeams').mockResolvedValue([])
    const groups = renderHook(() => useGroupsQuery(undefined), { wrapper: makeWrapper() })
    const groupTeams = renderHook(() => useGroupTeamsQuery(undefined), { wrapper: makeWrapper() })
    expect(groups.result.current.fetchStatus).toBe('idle')
    expect(groupTeams.result.current.fetchStatus).toBe('idle')
    expect(getGroups).not.toHaveBeenCalled()
    expect(getGroupTeams).not.toHaveBeenCalled()
  })

  it('refetches the group list after creating a group', async () => {
    vi.spyOn(sportsApi, 'getGroups').mockResolvedValueOnce([]).mockResolvedValueOnce([groupA])
    vi.spyOn(sportsApi, 'createGroup').mockResolvedValue(groupA)

    const wrapper = makeWrapper()
    const list = renderHook(() => useGroupsQuery(12), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([]))

    const create = renderHook(() => useCreateGroup(), { wrapper })
    await create.result.current.mutateAsync({ tournamentId: 12, name: 'Grupo A' })

    expect(sportsApi.createGroup).toHaveBeenCalledWith({ tournamentId: 12, name: 'Grupo A' })
    await waitFor(() => expect(list.result.current.data).toEqual([groupA]))
  })

  it('refetches the group list after renaming a group', async () => {
    const renamed = { ...groupA, name: 'Grupo Ouro' }
    vi.spyOn(sportsApi, 'getGroups').mockResolvedValueOnce([groupA]).mockResolvedValueOnce([renamed])
    vi.spyOn(sportsApi, 'updateGroup').mockResolvedValue(renamed)

    const wrapper = makeWrapper()
    const list = renderHook(() => useGroupsQuery(12), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([groupA]))

    const rename = renderHook(() => useUpdateGroup(), { wrapper })
    await rename.result.current.mutateAsync({ id: 7, input: { name: 'Grupo Ouro' } })

    expect(sportsApi.updateGroup).toHaveBeenCalledWith(7, { name: 'Grupo Ouro' })
    await waitFor(() => expect(list.result.current.data).toEqual([renamed]))
  })

  it('refetches the group list after deleting a group', async () => {
    vi.spyOn(sportsApi, 'getGroups').mockResolvedValueOnce([groupA]).mockResolvedValueOnce([])
    vi.spyOn(sportsApi, 'removeGroup').mockResolvedValue(undefined)

    const wrapper = makeWrapper()
    const list = renderHook(() => useGroupsQuery(12), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([groupA]))

    const remove = renderHook(() => useRemoveGroup(), { wrapper })
    await remove.result.current.mutateAsync(7)

    expect(sportsApi.removeGroup).toHaveBeenCalledWith(7)
    await waitFor(() => expect(list.result.current.data).toEqual([]))
  })

  it('refetches group teams after assigning a team to a group', async () => {
    vi.spyOn(sportsApi, 'getGroupTeams').mockResolvedValueOnce([]).mockResolvedValueOnce([membership31])
    vi.spyOn(sportsApi, 'assignTeamToGroup').mockResolvedValue(membership31)

    const wrapper = makeWrapper()
    const list = renderHook(() => useGroupTeamsQuery(12), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([]))

    const assign = renderHook(() => useAssignTeamToGroup(), { wrapper })
    await assign.result.current.mutateAsync({ tournamentGroupId: 7, tournamentTeamId: 41 })

    expect(sportsApi.assignTeamToGroup).toHaveBeenCalledWith({ tournamentGroupId: 7, tournamentTeamId: 41 })
    await waitFor(() => expect(list.result.current.data).toEqual([membership31]))
  })

  it('refetches group teams after removing a membership', async () => {
    vi.spyOn(sportsApi, 'getGroupTeams').mockResolvedValueOnce([membership31]).mockResolvedValueOnce([])
    vi.spyOn(sportsApi, 'removeGroupTeam').mockResolvedValue(undefined)

    const wrapper = makeWrapper()
    const list = renderHook(() => useGroupTeamsQuery(12), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([membership31]))

    const remove = renderHook(() => useRemoveGroupTeam(), { wrapper })
    await remove.result.current.mutateAsync(31)

    expect(sportsApi.removeGroupTeam).toHaveBeenCalledWith(31)
    await waitFor(() => expect(list.result.current.data).toEqual([]))
  })
})
