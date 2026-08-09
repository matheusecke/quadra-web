import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrgInvites } from './useOrgInvites'

const listMyInvitesMock = vi.fn()

vi.mock('../../services/inviteApi', () => ({
  listMyInvites: () => listMyInvitesMock(),
  respondToMyInvite: vi.fn(),
}))

describe('useOrgInvites', () => {
  beforeEach(() => {
    listMyInvitesMock.mockReset()
    listMyInvitesMock.mockResolvedValue([])
  })

  it('reloads the inbox from the API on every mount', async () => {
    const first = renderHook(() => useOrgInvites())
    await waitFor(() => expect(listMyInvitesMock).toHaveBeenCalledTimes(1))
    first.unmount()

    renderHook(() => useOrgInvites())

    await waitFor(() => expect(listMyInvitesMock).toHaveBeenCalledTimes(2))
  })
})
