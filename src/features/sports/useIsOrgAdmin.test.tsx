import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsOrgAdmin } from './useIsOrgAdmin'
import * as auth from '../../hooks/useAuth'

describe('useIsOrgAdmin', () => {
  it('is true when the active org role is ORG_ADMIN', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue({ user: { role: 'ORG_ADMIN' } } as never)
    expect(renderHook(() => useIsOrgAdmin()).result.current).toBe(true)
  })
  it('is false for a non-admin role', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue({ user: { role: 'ATHLETE' } } as never)
    expect(renderHook(() => useIsOrgAdmin()).result.current).toBe(false)
  })
})
