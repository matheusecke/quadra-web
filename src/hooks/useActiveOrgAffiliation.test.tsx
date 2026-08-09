import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useActiveOrgAffiliation } from './useActiveOrgAffiliation'
import * as auth from './useAuth'

const session = (organizationId: number | null, role: string | null, orgs: unknown[]) =>
  ({ user: organizationId === null && role === null ? null : { organizationId, role }, organizations: orgs }) as never

describe('useActiveOrgAffiliation', () => {
  it('reads the team of the affiliation backing the active organization', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue(
      session(42, 'TEAM_ADMIN', [
        { organizationId: 7, role: 'TEAM_ADMIN', teamId: 3 },
        { organizationId: 42, role: 'TEAM_ADMIN', teamId: 8 },
      ]),
    )

    expect(renderHook(() => useActiveOrgAffiliation()).result.current).toEqual({
      role: 'TEAM_ADMIN',
      teamId: 8,
    })
  })

  it('reports no team for an organization admin', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue(
      session(42, 'ORG_ADMIN', [{ organizationId: 42, role: 'ORG_ADMIN', teamId: null }]),
    )

    expect(renderHook(() => useActiveOrgAffiliation()).result.current).toEqual({
      role: 'ORG_ADMIN',
      teamId: null,
    })
  })

  it('reports nothing while no organization is selected', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue(session(null, null, []))

    expect(renderHook(() => useActiveOrgAffiliation()).result.current).toEqual({
      role: null,
      teamId: null,
    })
  })
})
