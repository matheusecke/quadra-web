import { describe, expect, it, vi, beforeEach } from 'vitest'
import api from './api'
import { listOrgTeams, listOrgUsers } from './orgApi'

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('orgApi', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })
  })

  it('calls the JWT-scoped user affiliations endpoint without orgId in the path', async () => {
    await listOrgUsers({
      page: 1,
      limit: 20,
      q: 'ana',
      status: 'ACTIVE',
      role: 'ATHLETE',
    })

    expect(api.get).toHaveBeenCalledWith('/organization-user-affiliations', {
      params: {
        page: 1,
        limit: 20,
        q: 'ana',
        status: 'ACTIVE',
        role: 'ATHLETE',
      },
    })

    const [calledUrl] = vi.mocked(api.get).mock.calls[0]
    expect(calledUrl).not.toBe('/organizations/42/user-affiliations')
    expect(calledUrl).not.toBe('/users')
  })

  it('calls the JWT-scoped team affiliations endpoint without orgId in the path', async () => {
    await listOrgTeams({
      page: 2,
      limit: 20,
      q: '',
      status: undefined,
    })

    expect(api.get).toHaveBeenCalledWith('/organization-team-affiliations', {
      params: {
        page: 2,
        limit: 20,
      },
    })

    const [calledUrl] = vi.mocked(api.get).mock.calls[0]
    expect(calledUrl).not.toBe('/organizations/42/team-affiliations')
    expect(calledUrl).not.toBe('/teams')
  })
})
