import api from '../api'
import type { ApiResponse } from '../../types/api'
import type { TournamentGroup, TournamentGroupTeam } from '../../features/sports/types'
import type { AssignGroupTeamInput, CreateGroupInput, UpdateGroupInput } from './types'

export const getGroups = (tournamentId: number) =>
  api.get<ApiResponse<TournamentGroup[]>>(`/tournaments/${tournamentId}/groups`).then(({ data }) => data.data)

export const createGroup = ({ tournamentId, name }: CreateGroupInput) =>
  api.post<ApiResponse<TournamentGroup>>(`/tournaments/${tournamentId}/groups`, { name }).then(({ data }) => data.data)

export const updateGroup = (id: number, input: UpdateGroupInput) =>
  api.patch<ApiResponse<TournamentGroup>>(`/tournament-groups/${id}`, input).then(({ data }) => data.data)

export const removeGroup = (id: number) => api.delete(`/tournament-groups/${id}`).then(() => undefined)

export const getGroupTeams = (tournamentId: number) =>
  api
    .get<ApiResponse<TournamentGroupTeam[]>>(`/tournaments/${tournamentId}/group-teams`)
    .then(({ data }) => data.data)

export const assignTeamToGroup = (input: AssignGroupTeamInput) =>
  api.post<ApiResponse<TournamentGroupTeam>>('/tournament-group-teams', input).then(({ data }) => data.data)

export const removeGroupTeam = (id: number) => api.delete(`/tournament-group-teams/${id}`).then(() => undefined)
