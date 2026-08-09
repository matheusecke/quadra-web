import api from './api'
import type { AffiliationStatus, OrgRole, PaginatedResponse } from '../types/admin'
import type { ApiResponse } from '../types/api'
import type {
  OrgTeamAffiliation,
  OrgUserAffiliation,
  TeamAffiliationCandidate,
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
