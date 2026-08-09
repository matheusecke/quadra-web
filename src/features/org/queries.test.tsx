import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  orgTeamKeys,
  orgUserKeys,
  useOrgMutation,
  useOrgTeamOptionsQuery,
  useOrgUsersInfiniteQuery,
  useUpdateTeamMutation,
} from './queries'
import * as orgApi from '../../services/orgApi'
import { teamProfileKeys } from '../sports/queries'

vi.mock('../../services/orgApi')

const emptyPage = {
  data: [],
  meta: { totalItems: 0, itemCount: 0, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '', previous: null, next: null, last: '' },
  statusCode: 200,
}

function createHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { queryClient, wrapper }
}

describe('org query keys', () => {
  it('separates two different user list filters', () => {
    const first = orgUserKeys.list({ q: 'ana', status: '', role: '', teamId: null })
    const second = orgUserKeys.list({ q: 'bia', status: '', role: '', teamId: null })

    expect(first).not.toEqual(second)
  })

  it('nests every user list under the shared invalidation root', () => {
    expect(orgUserKeys.list({ q: '', status: '', role: '', teamId: null })).toEqual(
      expect.arrayContaining([...orgUserKeys.all]),
    )
  })
})

describe('useOrgUsersInfiniteQuery', () => {
  beforeEach(() => {
    vi.mocked(orgApi.listOrgUsers).mockReset()
    vi.mocked(orgApi.listOrgUsers).mockResolvedValue(emptyPage)
  })

  it('drops the empty filters from the request', async () => {
    const { wrapper } = createHarness()

    renderHook(() => useOrgUsersInfiniteQuery({ q: '', status: '', role: '', teamId: null }), {
      wrapper,
    })

    await waitFor(() =>
      expect(orgApi.listOrgUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        q: undefined,
        status: undefined,
        role: undefined,
        teamId: undefined,
      }),
    )
  })

  it('forwards a selected team filter', async () => {
    const { wrapper } = createHarness()

    renderHook(() => useOrgUsersInfiniteQuery({ q: '', status: '', role: '', teamId: 8 }), {
      wrapper,
    })

    await waitFor(() => expect(vi.mocked(orgApi.listOrgUsers).mock.calls[0][0].teamId).toBe(8))
  })
})

describe('useOrgTeamOptionsQuery', () => {
  beforeEach(() => {
    vi.mocked(orgApi.listOrgTeams).mockReset()
    vi.mocked(orgApi.listOrgTeams).mockResolvedValue(emptyPage)
  })

  it('reads one large page of organization teams for the filter control', async () => {
    const { wrapper } = createHarness()

    renderHook(() => useOrgTeamOptionsQuery(true), { wrapper })

    await waitFor(() => expect(orgApi.listOrgTeams).toHaveBeenCalledWith({ page: 1, limit: 100 }))
  })

  it('reads nothing while it is disabled', () => {
    const { wrapper } = createHarness()

    renderHook(() => useOrgTeamOptionsQuery(false), { wrapper })

    expect(orgApi.listOrgTeams).not.toHaveBeenCalled()
  })
})

describe('useOrgMutation', () => {
  it('invalidates both organization roots after a successful write', async () => {
    const { queryClient, wrapper } = createHarness()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useOrgMutation((id: number) => Promise.resolve(id)), {
      wrapper,
    })

    result.current.mutate(91)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgUserKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgTeamKeys.all })
  })

  it('surfaces a failure instead of invalidating', async () => {
    const { queryClient, wrapper } = createHarness()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(
      () => useOrgMutation(() => Promise.reject(new Error('boom'))),
      { wrapper },
    )

    result.current.mutate(undefined)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe('useUpdateTeamMutation', () => {
  it('refreshes the team profile summary after saving the registration', async () => {
    vi.mocked(orgApi.updateTeam).mockReset()
    vi.mocked(orgApi.updateTeam).mockResolvedValue(undefined)
    const { queryClient, wrapper } = createHarness()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateTeamMutation(8), { wrapper })

    result.current.mutate({ name: 'Águias', shortName: 'AGU', city: null, state: null })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(orgApi.updateTeam).toHaveBeenCalledWith(8, {
      name: 'Águias',
      shortName: 'AGU',
      city: null,
      state: null,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: teamProfileKeys.summary(8) })
  })
})
