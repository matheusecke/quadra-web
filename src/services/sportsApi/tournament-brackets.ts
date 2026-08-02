import api from '../api'
import type { ApiResponse } from '../../types/api'
import type { BracketMatchView, BracketRound, BracketSlot, BracketSlotTeam, BracketSlotView } from '../../features/sports/types'
import type {
  CreateBracketRoundInput,
  CreateBracketSlotInput,
  LinkBracketSlotMatchInput,
  SetBracketSlotWinnerInput,
  UpdateBracketRoundInput,
  UpdateBracketSlotInput,
} from './types'

interface ReadSlot {
  id: number
  position: number
  label: string | null
  homeTeam: BracketSlotTeam | null
  awayTeam: BracketSlotTeam | null
  match: BracketMatchView | null
  winnerTournamentTeamId: number | null
}

interface ReadRound {
  id: number
  number: number
  label: string | null
  slots: ReadSlot[]
}

export interface BracketRead {
  rounds: BracketRound[]
  slots: BracketSlotView[]
}

/**
 * The read is a tree; every consumer wants two ordered lists. Flattening copies `roundId`
 * from the parent and passes the slot through as-is — no recomputation, no re-sorting.
 * The route takes no query string: anything appended is a 400.
 */
export const getBracket = (tournamentId: number): Promise<BracketRead> =>
  api.get<ApiResponse<{ rounds: ReadRound[] }>>(`/tournaments/${tournamentId}/bracket`).then(({ data }) => ({
    rounds: data.data.rounds.map((round) => ({
      id: round.id,
      tournamentId,
      number: round.number,
      label: round.label,
    })),
    slots: data.data.rounds.flatMap((round) =>
      round.slots.map((slot) => ({
        id: slot.id,
        roundId: round.id,
        position: slot.position,
        label: slot.label,
        homeTeam: slot.homeTeam,
        awayTeam: slot.awayTeam,
        match: slot.match,
        winnerTournamentTeamId: slot.winnerTournamentTeamId,
      })),
    ),
  }))

export const createBracketRound = ({ tournamentId, ...body }: CreateBracketRoundInput) =>
  api
    .post<ApiResponse<BracketRound>>(`/tournaments/${tournamentId}/bracket-rounds`, body)
    .then(({ data }) => data.data)

export const updateBracketRound = (id: number, input: UpdateBracketRoundInput) =>
  api.patch<ApiResponse<BracketRound>>(`/tournament-bracket-rounds/${id}`, input).then(({ data }) => data.data)

export const removeBracketRound = (id: number) =>
  api.delete(`/tournament-bracket-rounds/${id}`).then(() => undefined)

export const createBracketSlot = (input: CreateBracketSlotInput) =>
  api.post<ApiResponse<BracketSlot>>('/tournament-bracket-slots', input).then(({ data }) => data.data)

export const updateBracketSlot = (id: number, input: UpdateBracketSlotInput) =>
  api.patch<ApiResponse<BracketSlot>>(`/tournament-bracket-slots/${id}`, input).then(({ data }) => data.data)

export const removeBracketSlot = (id: number) =>
  api.delete(`/tournament-bracket-slots/${id}`).then(() => undefined)

export const linkBracketSlotMatch = (slotId: number, input: LinkBracketSlotMatchInput) =>
  api.post<ApiResponse<BracketSlot>>(`/tournament-bracket-slots/${slotId}/link-match`, input).then(({ data }) => data.data)

export const unlinkBracketSlotMatch = (slotId: number) =>
  api.delete(`/tournament-bracket-slots/${slotId}/link-match`).then(() => undefined)

export const setBracketSlotWinner = (slotId: number, input: SetBracketSlotWinnerInput) =>
  api.put<ApiResponse<BracketSlot>>(`/tournament-bracket-slots/${slotId}/winner`, input).then(({ data }) => data.data)
