import { describe, expect, it, vi, beforeEach } from 'vitest'
import api from './api'
import {
  listOrgTeams,
  listOrgUsers,
  listTeamAffiliationCandidates,
  lookupUserByEmail,
} from './orgApi'

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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

describe('orgApi reads', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })
  })

  it('forwards the team filter to the user affiliation list', async () => {
    await listOrgUsers({ page: 1, limit: 20, teamId: 8 })

    expect(api.get).toHaveBeenCalledWith('/organization-user-affiliations', {
      params: { page: 1, limit: 20, teamId: 8 },
    })
  })

  it('looks a user up by the exact trimmed email', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { id: 42, name: 'Marina Souza', email: 'marina@example.com' } },
    })

    const result = await lookupUserByEmail('  marina@example.com  ')

    expect(api.get).toHaveBeenCalledWith('/users/lookup', {
      params: { email: 'marina@example.com' },
    })
    expect(result).toEqual({ id: 42, name: 'Marina Souza', email: 'marina@example.com' })
  })

  it('reads team affiliation candidates from the dedicated catalog route', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [], meta: {}, links: {}, statusCode: 200 },
    })

    await listTeamAffiliationCandidates({ q: 'aguias' })

    expect(api.get).toHaveBeenCalledWith('/teams/affiliation-candidates', {
      params: { q: 'aguias', page: 1, limit: 10 },
    })
  })

  it('never reads candidates from the sports team catalog', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [], meta: {}, links: {}, statusCode: 200 },
    })

    await listTeamAffiliationCandidates({ q: 'aguias' })

    const [calledUrl] = vi.mocked(api.get).mock.calls[0]
    expect(calledUrl).not.toBe('/teams')
  })
})
