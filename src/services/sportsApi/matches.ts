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

export interface MatchPeriodInput {
  periodNumber: number
  periodType: 'REGULAR' | 'OVERTIME'
  homePoints: number
  awayPoints: number
}

export interface MatchPlayerStatisticInput {
  tournamentRosterId: number
  pts: number | null
  fgm: number | null
  fga: number | null
  threeFgm: number | null
  threeFga: number | null
  ftm: number | null
  fta: number | null
  reb: number | null
  ast: number | null
  stl: number | null
  blk: number | null
  tov: number | null
  pf: number | null
  minutesSeconds: number | null
}

export interface SaveMatchDraftInput {
  periods?: MatchPeriodInput[]
  playerStats?: MatchPlayerStatisticInput[]
  mvpTournamentRosterId?: number | null
}

interface PlayedMatchResultInput {
  periods: MatchPeriodInput[]
  playerStats: MatchPlayerStatisticInput[]
  mvpTournamentRosterId?: number | null
}

export type SubmitMatchResultInput =
  | ({ resultType?: 'NORMAL' } & PlayedMatchResultInput)
  | ({
      resultType: 'DEFAULT'
      offendingTournamentTeamId: number
    } & PlayedMatchResultInput)
  | {
      resultType: 'FORFEIT'
      offendingTournamentTeamId: number
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

export const saveMatchDraft = (id: number, input: SaveMatchDraftInput) =>
  api
    .post<ApiResponse<MatchDetail>>(`/matches/${id}/draft`, input)
    .then(({ data }) => data.data)

export const submitMatchResult = (id: number, input: SubmitMatchResultInput) =>
  api
    .post<ApiResponse<MatchDetail>>(`/matches/${id}/result`, input)
    .then(({ data }) => data.data)

export const reopenMatch = (id: number) =>
  api
    .post<ApiResponse<MatchDetail>>(`/matches/${id}/reopen`)
    .then(({ data }) => data.data)
