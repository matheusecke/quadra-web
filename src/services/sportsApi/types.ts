import type { PeriodScore, SeasonStatus, TournamentFormat, TournamentStatus } from '../../features/sports/types'
import type { PlayerStatInput } from '../../features/sports/statistics'

export interface CreateSeasonInput {
  label: string
  startDate: string
  endDate: string
}

export type UpdateSeasonInput = Partial<CreateSeasonInput> & { status?: SeasonStatus }

export interface CreateCategoryInput {
  name: string
  sortOrder?: number
}

export interface CreateTournamentInput {
  name: string
  seasonId: number
  categoryId: number | null
  format: TournamentFormat
  startDate: string
  endDate: string
  regulation?: string
}

export type UpdateTournamentInput = Partial<CreateTournamentInput> & { status?: Exclude<TournamentStatus, 'COMPLETED'> }

export interface CompleteTournamentInput {
  tournamentId: number
  championTournamentTeamId: number | null
}

export interface ReopenTournamentInput {
  tournamentId: number
}

export interface CreateBracketRoundInput {
  tournamentId: number
  /** Optional: defaults to the highest active number plus one. The UI never types it. */
  number?: number
  label?: string
}

export interface UpdateBracketRoundInput {
  label?: string
}

export interface CreateBracketSlotInput {
  tournamentId: number
  roundId: number
  /** Optional: defaults to the next free position in the round. The UI never types it. */
  position?: number
  label?: string
}

export interface UpdateBracketSlotInput {
  homeTournamentTeamId?: number | null
  awayTournamentTeamId?: number | null
  label?: string
}

export interface SetSlotWinnerInput {
  slotId: number
  winnerTournamentTeamId: number
}

export interface LinkSlotMatchInput {
  slotId: number
  matchId: number
}

export interface EnrollTeamInput {
  tournamentId: number
  teamId: number
  /** display_name_snapshot — the team's name at enrollment (DB spec §5.3). */
  displayName: string
  seed?: number
}

export interface CreateGroupInput {
  tournamentId: number
  name: string
  sortOrder?: number
}

export interface AssignGroupTeamInput {
  tournamentId: number
  groupId: number
  teamId: number
}

export interface RosterEntryInput {
  tournamentId: number
  teamId: number
  athleteId: number
  jerseyNumber: number
  role: 'ATHLETE' | 'COACHING_STAFF'
}

export interface UpdateRosterEntryInput {
  jerseyNumber?: number
  role?: 'ATHLETE' | 'COACHING_STAFF'
}

export interface ScheduleMatchInput {
  tournamentId: number
  homeTeamId: number
  awayTeamId: number
  scheduledAt: string
  venue?: string
  groupId?: number | null
}

/** The client identifies athletes by tournamentRosterId. It never sees match_rosters — §8.9. */
export type PlayerBoxScoreInput = PlayerStatInput & { tournamentRosterId: number }

export interface SetTiebreakOrderInput {
  tournamentId: number
  entries: { tournamentTeamId: number; order: number }[]
}

export interface ClearTiebreakOrderInput {
  tournamentId: number
  blockKey: string
}

interface PlayedResultInput {
  matchId: number
  periods: PeriodScore[]
  playerStats: PlayerBoxScoreInput[]
  mvpTournamentRosterId?: number | null
}

/**
 * Discriminated by resultType (§8.9). The client sends what happened on court and how it
 * ended; the server derives finalScore, result and lossType. The client never sends a score.
 */
export type SubmitMatchResultInput =
  | ({ resultType?: 'NORMAL' } & PlayedResultInput)
  | ({ resultType: 'DEFAULT'; offendingTournamentTeamId: number } & PlayedResultInput)
  | {
      // A W.O. has no game: no periods, no box score, no MVP. Not optional — forbidden.
      resultType: 'FORFEIT'
      matchId: number
      offendingTournamentTeamId: number
    }
