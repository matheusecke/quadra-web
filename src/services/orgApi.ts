import api from './api'
import type { AffiliationStatus, OrgRole, PaginatedResponse } from '../types/admin'
import type { ApiResponse } from '../types/api'
import type {
  CreateTeamOnboardingInput,
  InviteTeamMemberInput,
  OrgTeamAffiliation,
  OrgUserAffiliation,
  TeamAffiliationCandidate,
  UpdateMembershipInput,
  UpdateTeamInput,
  UserLookupResult,
} from '../types/org'

export type ListOrgUsersParams = {
  page: number
  limit?: number
  q?: string
  status?: AffiliationStatus
  role?: OrgRole
  teamId?: number
  inviteExpired?: boolean
}

export type ListOrgTeamsParams = {
  page: number
  limit?: number
  q?: string
  status?: AffiliationStatus
  inviteExpired?: boolean
}

const strip = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== '' && value !== undefined))

// Normal organization scope is derived from the JWT selected via POST /auth/org.
export const listOrgUsers = (params: ListOrgUsersParams) =>
  api
    .get<PaginatedResponse<OrgUserAffiliation>>('/organization-user-affiliations', {
      params: strip(params as Record<string, unknown>),
    })
    .then((response) => response.data)

export const listOrgTeams = (params: ListOrgTeamsParams) =>
  api
    .get<PaginatedResponse<OrgTeamAffiliation>>('/organization-team-affiliations', {
      params: strip(params as Record<string, unknown>),
    })
    .then((response) => response.data)

export const lookupUserByEmail = (email: string) =>
  api
    .get<ApiResponse<UserLookupResult>>('/users/lookup', { params: { email: email.trim() } })
    .then((response) => response.data.data)

export const listTeamAffiliationCandidates = (params: {
  q: string
  page?: number
  limit?: number
}) =>
  api
    .get<PaginatedResponse<TeamAffiliationCandidate>>('/teams/affiliation-candidates', {
      params: strip({ q: params.q, page: params.page ?? 1, limit: params.limit ?? 10 }),
    })
    .then((response) => response.data)

// The invite responses carry raw tokens (spec §10.3, §10.8). The UI never reads them.
export const inviteOrgAdmin = (input: { userId: number }) =>
  api.post('/organization-user-affiliations', input).then(() => undefined)

export const inviteTeamMember = (teamId: number, input: InviteTeamMemberInput) =>
  api.post(`/teams/${teamId}/organization-user-affiliations`, input).then(() => undefined)

export const createTeamOnboarding = (input: CreateTeamOnboardingInput) =>
  api.post('/organization-team-affiliations', input).then(() => undefined)

export const updateMembership = (affiliationId: number, input: UpdateMembershipInput) =>
  api
    .patch<ApiResponse<OrgUserAffiliation>>(
      `/organization-user-affiliations/${affiliationId}`,
      input,
    )
    .then((response) => response.data.data)

export const activateUserAffiliation = (affiliationId: number) =>
  api
    .post<ApiResponse<OrgUserAffiliation>>(
      `/organization-user-affiliations/${affiliationId}/activate`,
    )
    .then((response) => response.data.data)

export const deactivateUserAffiliation = (affiliationId: number) =>
  api
    .post<ApiResponse<OrgUserAffiliation>>(
      `/organization-user-affiliations/${affiliationId}/deactivate`,
    )
    .then((response) => response.data.data)

export const cancelUserInvite = (affiliationId: number) =>
  api.delete(`/organization-user-affiliations/${affiliationId}`).then(() => undefined)

export const resendUserInvite = (affiliationId: number) =>
  api.post(`/organization-user-affiliations/${affiliationId}/resend`).then(() => undefined)

export const activateTeamAffiliation = (affiliationId: number) =>
  api
    .post<ApiResponse<OrgTeamAffiliation>>(
      `/organization-team-affiliations/${affiliationId}/activate`,
    )
    .then((response) => response.data.data)

export const deactivateTeamAffiliation = (affiliationId: number) =>
  api
    .post<ApiResponse<OrgTeamAffiliation>>(
      `/organization-team-affiliations/${affiliationId}/deactivate`,
    )
    .then((response) => response.data.data)

export const cancelTeamInclusion = (affiliationId: number) =>
  api.delete(`/organization-team-affiliations/${affiliationId}`).then(() => undefined)

export const resendTeamInvites = (affiliationId: number) =>
  api.post(`/organization-team-affiliations/${affiliationId}/resend`).then(() => undefined)

export const updateTeam = (teamId: number, input: UpdateTeamInput) =>
  api.patch(`/teams/${teamId}`, input).then(() => undefined)
