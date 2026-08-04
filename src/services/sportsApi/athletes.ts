import type {
  AthleteMatchHistoryRow,
  AthleteProfile,
  AthleteStatistics,
  AthleteTournamentHistoryRow,
} from '../../features/sports/types'
import type { PaginatedResponse } from '../../types/admin'
import type { ApiResponse } from '../../types/api'
import api from '../api'

export interface ListAthleteMatchesParams {
  page?: number
  limit?: number
  ids?: number[]
  tournamentId?: number
}

export interface ListAthleteTournamentsParams {
  page?: number
  limit?: number
  ids?: number[]
  seasonId?: number
}

export const getAthlete = (id: number) =>
  api.get<ApiResponse<AthleteProfile>>(`/athletes/${id}`).then(({ data }) => data.data)

export const getAthleteStatistics = (id: number) =>
  api.get<ApiResponse<AthleteStatistics>>(`/athletes/${id}/statistics`).then(({ data }) => data.data)

export const listAthleteMatchesPage = (id: number, params: ListAthleteMatchesParams = {}) =>
  api
    .get<PaginatedResponse<AthleteMatchHistoryRow>>(`/athletes/${id}/matches`, { params })
    .then(({ data }) => data)

export const listAthleteTournamentsPage = (id: number, params: ListAthleteTournamentsParams = {}) =>
  api
    .get<PaginatedResponse<AthleteTournamentHistoryRow>>(`/athletes/${id}/tournaments`, { params })
    .then(({ data }) => data)
