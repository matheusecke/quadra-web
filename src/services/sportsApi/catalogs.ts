import api from '../api'
import type { PaginatedResponse } from '../../types/admin'
import type { RosterCandidate, Team } from '../../features/sports/types'
import { collectPages } from './pagination'

export interface ListTeamsParams {
  page?: number
  limit?: number
  q?: string
  ids?: number[]
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface ListRosterCandidatesParams {
  page?: number
  limit?: number
  q?: string
  ids?: number[]
  teamId?: number
  role?: 'ATHLETE' | 'COACHING_STAFF'
}

/** Teto de `limit` do backend. */
const PAGE_LIMIT = 100

export const listTeamsPage = (params: ListTeamsParams = {}) =>
  api.get<PaginatedResponse<Team>>('/teams', { params }).then(({ data }) => data)

export const getTeams = (params: Omit<ListTeamsParams, 'page' | 'limit'> = {}) =>
  collectPages((page) => listTeamsPage({ ...params, page, limit: PAGE_LIMIT }))

export const searchTeams = (q: string) => getTeams({ q, status: 'ACTIVE' })

export const listRosterCandidatesPage = (params: ListRosterCandidatesParams = {}) =>
  api.get<PaginatedResponse<RosterCandidate>>('/athletes', { params }).then(({ data }) => data)

export const searchRosterCandidates = (
  params: Pick<ListRosterCandidatesParams, 'q' | 'teamId' | 'role'>,
) => collectPages((page) => listRosterCandidatesPage({ ...params, page, limit: PAGE_LIMIT }))
