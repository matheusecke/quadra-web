import api from './api'
import type {
  AdminOrg,
  AdminTeam,
  AdminTeamAffiliation,
  AdminUser,
  AdminUserAffiliation,
  AffiliationStatus,
  EntityStatus,
  OrgRole,
  PaginatedResponse,
} from '../types/admin'
import type { ApiResponse } from '../types/api'

type ListUsersParams = {
  page: number
  limit?: number
  q?: string
  status?: EntityStatus
  role?: OrgRole
  isSystemAdmin?: boolean
}

type ListOrgsParams = {
  page: number
  limit?: number
  q?: string
  status?: EntityStatus
}

type ListTeamsParams = {
  page: number
  limit?: number
  q?: string
  status?: EntityStatus
}

type ListUserAffiliationsParams = {
  page: number
  limit?: number
  q?: string
  status?: AffiliationStatus
  role?: OrgRole
  teamId?: number
  inviteExpired?: boolean
}

type ListTeamAffiliationsParams = {
  page: number
  limit?: number
  q?: string
  status?: AffiliationStatus
  inviteExpired?: boolean
}

const strip = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined))

// Users
export const listUsers = (params: ListUsersParams) =>
  api.get<PaginatedResponse<AdminUser>>('/users', { params: strip(params as Record<string, unknown>) }).then((r) => r.data)

export const getUser = (id: number) =>
  api.get<ApiResponse<AdminUser>>(`/users/${id}`).then((r) => r.data.data)

export const createUser = (data: { email: string; name: string; password: string; isSystemAdmin?: boolean }) =>
  api.post<ApiResponse<AdminUser>>('/users', data).then((r) => r.data.data)

export const updateUser = (id: number, data: { name: string }) =>
  api.patch<ApiResponse<AdminUser>>(`/users/${id}`, data).then((r) => r.data.data)

export const updateUserStatus = (id: number, status: EntityStatus) =>
  api.patch(`/users/${id}/status`, { status })

export const updateUserSystemAdmin = (id: number, isSystemAdmin: boolean) =>
  api.patch(`/users/${id}/system-admin`, { isSystemAdmin })

// Organizations
export const listOrgs = (params: ListOrgsParams) =>
  api.get<PaginatedResponse<AdminOrg>>('/organizations', { params: strip(params as Record<string, unknown>) }).then((r) => r.data)

export const getOrg = (id: number) =>
  api.get<ApiResponse<AdminOrg>>(`/organizations/${id}`).then((r) => r.data.data)

export const createOrg = (data: { name: string }) =>
  api.post<ApiResponse<AdminOrg>>('/organizations', data).then((r) => r.data.data)

export const updateOrg = (id: number, data: { name: string }) =>
  api.patch<ApiResponse<AdminOrg>>(`/organizations/${id}`, data).then((r) => r.data.data)

export const updateOrgStatus = (id: number, status: EntityStatus) =>
  api.patch(`/organizations/${id}/status`, { status })

// Teams
export const listTeams = (params: ListTeamsParams) =>
  api.get<PaginatedResponse<AdminTeam>>('/teams', { params: strip(params as Record<string, unknown>) }).then((r) => r.data)

export const getTeam = (id: number) =>
  api.get<ApiResponse<AdminTeam>>(`/teams/${id}`).then((r) => r.data.data)

export const createTeam = (data: { name: string }) =>
  api.post<ApiResponse<AdminTeam>>('/teams', data).then((r) => r.data.data)

export const updateTeam = (id: number, data: { name: string }) =>
  api.patch<ApiResponse<AdminTeam>>(`/teams/${id}`, data).then((r) => r.data.data)

export const updateTeamStatus = (id: number, status: EntityStatus) =>
  api.patch(`/teams/${id}/status`, { status })

// User affiliations
export const listUserAffiliations = (orgId: number, params: ListUserAffiliationsParams) =>
  api
    .get<PaginatedResponse<AdminUserAffiliation>>(`/organizations/${orgId}/user-affiliations`, {
      params: strip(params as Record<string, unknown>),
    })
    .then((r) => r.data)

export const createUserAffiliation = (
  orgId: number,
  data: { userId: number; role: OrgRole; teamId?: number; jerseyNumber?: number },
) => api.post<ApiResponse<AdminUserAffiliation>>(`/organizations/${orgId}/user-affiliations`, data).then((r) => r.data.data)

export const updateUserAffiliation = (
  orgId: number,
  id: number,
  data: { role: OrgRole; teamId?: number | null; jerseyNumber?: number | null },
) =>
  api
    .patch<ApiResponse<AdminUserAffiliation>>(`/organizations/${orgId}/user-affiliations/${id}`, data)
    .then((r) => r.data.data)

export const updateUserAffiliationStatus = (orgId: number, id: number, status: AffiliationStatus) =>
  api.patch(`/organizations/${orgId}/user-affiliations/${id}/status`, { status })

export const resendUserAffiliationInvite = (orgId: number, id: number) =>
  api.post(`/organizations/${orgId}/user-affiliations/${id}/resend`)

// Team affiliations
export const listTeamAffiliations = (orgId: number, params: ListTeamAffiliationsParams) =>
  api
    .get<PaginatedResponse<AdminTeamAffiliation>>(`/organizations/${orgId}/team-affiliations`, {
      params: strip(params as Record<string, unknown>),
    })
    .then((r) => r.data)

export const createTeamAffiliation = (orgId: number, data: { teamId: number }) =>
  api.post<ApiResponse<AdminTeamAffiliation>>(`/organizations/${orgId}/team-affiliations`, data).then((r) => r.data.data)

export const updateTeamAffiliationStatus = (orgId: number, id: number, status: AffiliationStatus) =>
  api.patch(`/organizations/${orgId}/team-affiliations/${id}/status`, { status })

export const resendTeamAffiliationInvite = (orgId: number, id: number) =>
  api.post(`/organizations/${orgId}/team-affiliations/${id}/resend`)
