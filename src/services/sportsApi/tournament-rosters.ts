import api from '../api'
import type { ApiResponse } from '../../types/api'
import type { TournamentRoster } from '../../features/sports/types'
import type { CreateTournamentRosterInput, UpdateTournamentRosterInput } from './types'

export const getTournamentRoster = (tournamentTeamId: number) =>
  api
    .get<ApiResponse<TournamentRoster[]>>(`/tournament-teams/${tournamentTeamId}/tournament-rosters`)
    .then(({ data }) => data.data)

export const addTournamentRoster = (input: CreateTournamentRosterInput) =>
  api.post<ApiResponse<TournamentRoster>>('/tournament-rosters', input).then(({ data }) => data.data)

export const updateTournamentRoster = (id: number, input: UpdateTournamentRosterInput) =>
  api.patch<ApiResponse<TournamentRoster>>(`/tournament-rosters/${id}`, input).then(({ data }) => data.data)

export const removeTournamentRoster = (id: number) =>
  api.delete(`/tournament-rosters/${id}`).then(() => undefined)
