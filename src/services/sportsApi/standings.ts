import api from '../api'
import type { ApiResponse } from '../../types/api'
import type { StandingsEnvelope } from '../../features/sports/types'
import type { ClearTiebreakOrderInput, SetTiebreakOrderInput } from './types'

/** Always an array: one table per group, or a single `group: null` table in LEAGUE, or none. */
export const listStandings = (tournamentId: number, groupId?: number) =>
  api
    .get<ApiResponse<StandingsEnvelope[]>>(`/tournaments/${tournamentId}/standings`, { params: { groupId } })
    .then(({ data }) => data.data)

/** Answers with the recomputed tables, so the caller needs no follow-up read. */
export const setTiebreakOrder = ({ tournamentId, entries }: SetTiebreakOrderInput) =>
  api
    .put<ApiResponse<StandingsEnvelope[]>>(`/tournaments/${tournamentId}/tiebreaks`, { entries })
    .then(({ data }) => data.data)

export const clearTiebreakOrder = ({ tournamentId, blockKey }: ClearTiebreakOrderInput) =>
  api.delete(`/tournaments/${tournamentId}/tiebreaks/${blockKey}`).then(() => undefined)
