import type { MatchDetail, MatchStatus, MatchSummary } from '../../features/sports/types'
import type { PaginatedResponse } from '../../types/admin'
import type { ApiResponse } from '../../types/api'
import api from '../api'

export interface ListMatchesParams {
  page?: number
  limit?: number
  q?: string
  ids?: number[]
  tournamentId?: number
  tournamentTeamIds?: number[]
  status?: MatchStatus
}

export type ListTournamentMatchesParams = Omit<ListMatchesParams, 'tournamentId'>

export interface CreateMatchInput {
  tournamentId: number
  tournamentGroupId?: number | null
  matchNumber?: number | null
  scheduledAt: string
  venueName?: string | null
  homeTournamentTeamId: number
  awayTournamentTeamId: number
}

export interface UpdateMatchInput {
  tournamentGroupId?: number | null
  matchNumber?: number | null
  scheduledAt?: string
  venueName?: string | null
  homeTournamentTeamId?: number
  awayTournamentTeamId?: number
}

export const listMatchesPage = (params: ListMatchesParams = {}) =>
  api.get<PaginatedResponse<MatchSummary>>('/matches', { params }).then(({ data }) => data)

export const listTournamentMatchesPage = (
  tournamentId: number,
  params: ListTournamentMatchesParams = {},
) =>
  api
    .get<PaginatedResponse<MatchSummary>>(`/tournaments/${tournamentId}/matches`, { params })
    .then(({ data }) => data)

export const getMatch = (id: number) =>
  api.get<ApiResponse<MatchDetail>>(`/matches/${id}`).then(({ data }) => data.data)

export const createMatch = (input: CreateMatchInput) =>
  api.post<ApiResponse<MatchDetail>>('/matches', input).then(({ data }) => data.data)

export const updateMatch = (id: number, input: UpdateMatchInput) =>
  api.patch<ApiResponse<MatchDetail>>(`/matches/${id}`, input).then(({ data }) => data.data)

export const postponeMatch = (id: number) =>
  api.post<ApiResponse<MatchDetail>>(`/matches/${id}/postpone`).then(({ data }) => data.data)

export const cancelMatch = (id: number) =>
  api.post<ApiResponse<MatchDetail>>(`/matches/${id}/cancel`).then(({ data }) => data.data)
