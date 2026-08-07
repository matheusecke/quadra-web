import api from '../api'
import type { PaginatedResponse } from '../../types/admin'
import type { ApiResponse } from '../../types/api'
import type { TournamentTeam } from '../../features/sports/types'
import type { EnrollTeamInput, UpdateTournamentTeamInput } from './types'
import { collectPages } from './pagination'
import { getTournaments } from './tournaments'

export interface ListTournamentTeamsParams {
  page?: number
  limit?: number
  q?: string
  ids?: number[]
  status?: 'ACTIVE' | 'WITHDRAWN'
}

/** Teto de `limit` do backend. */
const PAGE_LIMIT = 100

export const listTournamentTeamsPage = (tournamentId: number, params: ListTournamentTeamsParams = {}) =>
  api
    .get<PaginatedResponse<TournamentTeam>>(`/tournaments/${tournamentId}/teams`, { params })
    .then(({ data }) => data)

export const getTournamentTeams = (tournamentId: number) =>
  collectPages((page) => listTournamentTeamsPage(tournamentId, { page, limit: PAGE_LIMIT, status: 'ACTIVE' }))

/** Fan-out transitório para a listagem mockada de partidas entre campeonatos; some quando ela integrar. */
export const getAllTournamentTeams = () =>
  getTournaments()
    .then((tournaments) => Promise.all(tournaments.map((t) => getTournamentTeams(t.id))))
    .then((lists) => lists.flat())

export const enrollTeam = ({ tournamentId, teamId }: EnrollTeamInput) =>
  api
    .post<ApiResponse<TournamentTeam>>(`/tournaments/${tournamentId}/teams`, { teamId })
    .then(({ data }) => data.data)

export const updateTournamentTeam = (id: number, input: UpdateTournamentTeamInput) =>
  api.patch<ApiResponse<TournamentTeam>>(`/tournament-teams/${id}`, input).then(({ data }) => data.data)

export const removeTournamentTeam = (id: number) =>
  api.delete(`/tournament-teams/${id}`).then(() => undefined)
