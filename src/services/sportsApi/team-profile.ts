import type {
  TeamMatchHistoryRow,
  TeamMatchScope,
  TeamSummary,
  TeamTournamentHistoryRow,
} from '../../features/sports/types'
import type { PaginatedResponse } from '../../types/admin'
import type { ApiResponse } from '../../types/api'
import api from '../api'

export interface ListTeamMatchesParams {
  page?: number
  limit?: number
  /** Required by the API; `upcoming` and `history` are the only accepted values. */
  scope: TeamMatchScope
}

export interface ListTeamTournamentsParams {
  page?: number
  limit?: number
}

export const getTeamSummary = (id: number) =>
  api.get<ApiResponse<TeamSummary>>(`/teams/${id}/summary`).then(({ data }) => data.data)

export const listTeamMatchesPage = (id: number, params: ListTeamMatchesParams) =>
  api
    .get<PaginatedResponse<TeamMatchHistoryRow>>(`/teams/${id}/matches`, { params })
    .then(({ data }) => data)

export const listTeamTournamentsPage = (id: number, params: ListTeamTournamentsParams = {}) =>
  api
    .get<PaginatedResponse<TeamTournamentHistoryRow>>(`/teams/${id}/tournaments`, { params })
    .then(({ data }) => data)
