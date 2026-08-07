import api from '../api'
import type { PaginatedResponse } from '../../types/admin'
import type { ApiResponse } from '../../types/api'
import type { Tournament, TournamentLeaders, TournamentStatus } from '../../features/sports/types'
import type {
  CompleteTournamentInput,
  CreateTournamentInput,
  ReopenTournamentInput,
  UpdateTournamentInput,
} from './types'

export interface ListTournamentsParams {
  page?: number
  limit?: number
  /** Parcial, case-insensitive e accent-sensitive, só sobre `name`. */
  q?: string
  /** Repetido na query string (`?ids=12&ids=15`), nunca CSV — contrato §37. */
  ids?: number[]
  seasonId?: number
  categoryId?: number
  status?: TournamentStatus
}

/** Teto de `limit` do backend. */
const LOOKUP_PAGE_LIMIT = 100

export const listTournamentsPage = (params: ListTournamentsParams = {}) =>
  api.get<PaginatedResponse<Tournament>>('/tournaments', { params }).then((r) => r.data)

// ponytail: uma página de 100 cobre os seletores; acima disso o consumidor precisa paginar.
export const getTournaments = (params: Omit<ListTournamentsParams, 'page' | 'limit'> = {}) =>
  listTournamentsPage({ ...params, page: 1, limit: LOOKUP_PAGE_LIMIT }).then((r) => r.data)

export const getTournament = (id: number) =>
  api.get<ApiResponse<Tournament>>(`/tournaments/${id}`).then((r) => r.data.data)

export const getTournamentLeaders = (id: number) =>
  api
    .get<ApiResponse<TournamentLeaders>>(`/tournaments/${id}/leaders`)
    .then(({ data }) => data.data)

export const createTournament = (input: CreateTournamentInput) =>
  api.post<ApiResponse<Tournament>>('/tournaments', input).then((r) => r.data.data)

export const updateTournament = (id: number, input: UpdateTournamentInput) =>
  api.patch<ApiResponse<Tournament>>(`/tournaments/${id}`, input).then((r) => r.data.data)

/** Responde 200 com o read model já atualizado — nenhum GET de confirmação depois. */
export const completeTournament = ({ tournamentId, championTournamentTeamId }: CompleteTournamentInput) =>
  api
    .post<ApiResponse<Tournament>>(`/tournaments/${tournamentId}/complete`, { championTournamentTeamId })
    .then((r) => r.data.data)

export const reopenTournament = ({ tournamentId }: ReopenTournamentInput) =>
  api.post<ApiResponse<Tournament>>(`/tournaments/${tournamentId}/reopen`).then((r) => r.data.data)

/** Sugestão para pré-selecionar no diálogo de encerramento, nunca um fato. */
export const getChampionSuggestion = (tournamentId: number) =>
  api
    .get<ApiResponse<{ championTournamentTeamId: number | null }>>(`/tournaments/${tournamentId}/champion-suggestion`)
    .then((r) => r.data.data.championTournamentTeamId)
