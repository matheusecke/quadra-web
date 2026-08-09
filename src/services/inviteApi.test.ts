import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import { listMyInvites, respondToMyInvite } from './inviteApi'

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('inviteApi', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  it('lists authenticated user invites', async () => {
    const invites = [
      {
        id: 10,
        organizationId: 101,
        organizationName: 'Liga Metropolitana',
        role: 'ATHLETE',
        teamId: 22,
        teamName: 'Campinas Hawks',
        jerseyNumber: 12,
        status: 'PENDING',
        sentAt: '2026-06-17T12:00:00.000Z',
        expiresAt: '2026-06-24T12:00:00.000Z',
        isExpired: false,
      },
    ]

    vi.mocked(api.get).mockResolvedValue({ data: { data: invites, statusCode: 200 } })

    await expect(listMyInvites()).resolves.toEqual(invites)
    expect(api.get).toHaveBeenCalledWith('/auth/invites')
  })

  it('responds to an invite with ACCEPT', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: null, statusCode: 200 } })

    await expect(respondToMyInvite(10, 'ACCEPT')).resolves.toBeUndefined()
    expect(api.post).toHaveBeenCalledWith('/auth/invites/10/respond', { decision: 'ACCEPT' })
  })

  it('responds to an invite with REJECT', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: null, statusCode: 200 } })

    await expect(respondToMyInvite(10, 'REJECT')).resolves.toBeUndefined()
    expect(api.post).toHaveBeenCalledWith('/auth/invites/10/respond', { decision: 'REJECT' })
  })

  it('propagates list errors', async () => {
    const error = new Error('network failed')
    vi.mocked(api.get).mockRejectedValue(error)

    await expect(listMyInvites()).rejects.toThrow('network failed')
  })

  it('answers every invite through the single respond endpoint', async () => {
    await respondToMyInvite(10, 'ACCEPT')
    await respondToMyInvite(11, 'REJECT')

    expect(vi.mocked(api.post).mock.calls.map(([url]) => url)).toEqual([
      '/auth/invites/10/respond',
      '/auth/invites/11/respond',
    ])
  })
})
