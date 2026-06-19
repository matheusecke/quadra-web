import api from './api'
import type {
  AdminTeamAffiliation,
  AdminUserAffiliation,
  AffiliationStatus,
  OrgRole,
  PaginatedResponse,
} from '../types/admin'

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
    .get<PaginatedResponse<AdminUserAffiliation>>('/organization-user-affiliations', {
      params: strip(params as Record<string, unknown>),
    })
    .then((response) => response.data)

export const listOrgTeams = (params: ListOrgTeamsParams) =>
  api
    .get<PaginatedResponse<AdminTeamAffiliation>>('/organization-team-affiliations', {
      params: strip(params as Record<string, unknown>),
    })
    .then((response) => response.data)
