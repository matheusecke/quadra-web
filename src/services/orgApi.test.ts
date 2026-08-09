import { describe, expect, it, vi, beforeEach } from 'vitest'
import api from './api'
import {
  activateTeamAffiliation,
  activateUserAffiliation,
  cancelTeamInclusion,
  cancelUserInvite,
  createTeamOnboarding,
  deactivateTeamAffiliation,
  deactivateUserAffiliation,
  inviteOrgAdmin,
  inviteTeamMember,
  listOrgTeams,
  listOrgUsers,
  listTeamAffiliationCandidates,
  lookupUserByEmail,
  resendTeamInvites,
  resendUserInvite,
  updateMembership,
  updateTeam,
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

describe('orgApi writes', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    vi.mocked(api.patch).mockReset()
    vi.mocked(api.delete).mockReset()
    vi.mocked(api.post).mockResolvedValue({ data: { data: {} } })
    vi.mocked(api.patch).mockResolvedValue({ data: { data: {} } })
    vi.mocked(api.delete).mockResolvedValue({ data: undefined })
  })

  it('invites an organization administrator with only the recipient', async () => {
    await inviteOrgAdmin({ userId: 42 })

    expect(api.post).toHaveBeenCalledWith('/organization-user-affiliations', { userId: 42 })
  })

  it('discards the invite bundle so no raw token can reach the UI', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { affiliation: { id: 91 }, inviteToken: 'raw-token' } },
    })

    await expect(inviteOrgAdmin({ userId: 42 })).resolves.toBeUndefined()
  })

  it('invites a member through the nested team route', async () => {
    await inviteTeamMember(8, { userId: 42, role: 'ATHLETE', jerseyNumber: 12, position: 'PG' })

    expect(api.post).toHaveBeenCalledWith('/teams/8/organization-user-affiliations', {
      userId: 42,
      role: 'ATHLETE',
      jerseyNumber: 12,
      position: 'PG',
    })
  })

  it('onboards an existing team with its first administrator', async () => {
    await createTeamOnboarding({ teamId: 8, adminUserId: 42 })

    expect(api.post).toHaveBeenCalledWith('/organization-team-affiliations', {
      teamId: 8,
      adminUserId: 42,
    })
  })

  it('onboards a brand new team by name', async () => {
    await createTeamOnboarding({ teamName: 'Águias Campinas', adminUserId: 42 })

    expect(api.post).toHaveBeenCalledWith('/organization-team-affiliations', {
      teamName: 'Águias Campinas',
      adminUserId: 42,
    })
  })

  it('edits only jersey and position of a membership', async () => {
    await updateMembership(91, { jerseyNumber: 7, position: 'SG' })

    expect(api.patch).toHaveBeenCalledWith('/organization-user-affiliations/91', {
      jerseyNumber: 7,
      position: 'SG',
    })
  })

  it('returns the updated affiliation from a deactivation', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 91, status: 'INACTIVE' } } })

    const result = await deactivateUserAffiliation(91)

    expect(api.post).toHaveBeenCalledWith('/organization-user-affiliations/91/deactivate')
    expect(result).toEqual({ id: 91, status: 'INACTIVE' })
  })

  it('activates a user affiliation through its explicit transition route', async () => {
    await activateUserAffiliation(91)

    expect(api.post).toHaveBeenCalledWith('/organization-user-affiliations/91/activate')
  })

  it('cancels a pending user invite with a delete', async () => {
    await cancelUserInvite(91)

    expect(api.delete).toHaveBeenCalledWith('/organization-user-affiliations/91')
  })

  it('resends a single user invite', async () => {
    await resendUserInvite(91)

    expect(api.post).toHaveBeenCalledWith('/organization-user-affiliations/91/resend')
  })

  it('deactivates a team affiliation through its explicit transition route', async () => {
    await deactivateTeamAffiliation(15)

    expect(api.post).toHaveBeenCalledWith('/organization-team-affiliations/15/deactivate')
  })

  it('activates a team affiliation through its explicit transition route', async () => {
    await activateTeamAffiliation(15)

    expect(api.post).toHaveBeenCalledWith('/organization-team-affiliations/15/activate')
  })

  it('cancels the whole team inclusion with a delete', async () => {
    await cancelTeamInclusion(15)

    expect(api.delete).toHaveBeenCalledWith('/organization-team-affiliations/15')
  })

  it('resends every pending administrator invite of a team', async () => {
    await resendTeamInvites(15)

    expect(api.post).toHaveBeenCalledWith('/organization-team-affiliations/15/resend')
  })

  it('updates the global team registration', async () => {
    await updateTeam(8, {
      name: 'Águias Campinas',
      shortName: 'AGC',
      city: 'Campinas',
      state: 'SP',
    })

    expect(api.patch).toHaveBeenCalledWith('/teams/8', {
      name: 'Águias Campinas',
      shortName: 'AGC',
      city: 'Campinas',
      state: 'SP',
    })
  })

  it('never sends an organization id on an organization-scoped write', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: {} } })

    await inviteOrgAdmin({ userId: 42 })

    expect(api.post).toHaveBeenCalledWith('/organization-user-affiliations', { userId: 42 })
  })
})
