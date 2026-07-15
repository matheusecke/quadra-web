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
  seasonId: string
  categoryId: string | null
  format: TournamentFormat
  startDate: string
  endDate: string
  regulation?: string
}

export type UpdateTournamentInput = Partial<CreateTournamentInput> & { status?: Exclude<TournamentStatus, 'COMPLETED'> }

export interface CompleteTournamentInput {
  tournamentId: string
  championTournamentTeamId: string | null
}

export interface ReopenTournamentInput {
  tournamentId: string
}

export interface CreateBracketSlotInput {
  tournamentId: string
  roundNumber: number
  /** Optional: defaults to the next free position in the round. The UI never types it. */
  position?: number
  label?: string
}

export interface UpdateBracketSlotInput {
  homeTournamentTeamId?: string | null
  awayTournamentTeamId?: string | null
  label?: string
}

export interface SetSlotWinnerInput {
  slotId: string
  winnerTournamentTeamId: string
}

export interface LinkSlotMatchInput {
  slotId: string
  matchId: string
}

export interface EnrollTeamInput {
  tournamentId: string
  teamId: string
  /** display_name_snapshot — the team's name at enrollment (DB spec §5.3). */
  displayName: string
  seed?: number
}

export interface CreateGroupInput {
  tournamentId: string
  name: string
  sortOrder?: number
}

export interface AssignGroupTeamInput {
  tournamentId: string
  groupId: string
  teamId: string
}

export interface RosterEntryInput {
  tournamentId: string
  teamId: string
  athleteId: string
  jerseyNumber: number
  role: 'ATHLETE' | 'COACHING_STAFF'
}

export interface UpdateRosterEntryInput {
  jerseyNumber?: number
  role?: 'ATHLETE' | 'COACHING_STAFF'
}

export interface ScheduleMatchInput {
  tournamentId: string
  homeTeamId: string
  awayTeamId: string
  scheduledAt: string
  venue?: string
  groupId?: string | null
  phaseLabel?: string
}

/** The client identifies athletes by tournamentRosterId. It never sees match_rosters — §8.9. */
export type PlayerBoxScoreInput = PlayerStatInput & { tournamentRosterId: string }

export interface SetTiebreakOrderInput {
  tournamentId: string
  entries: { tournamentTeamId: string; order: number }[]
}

export interface ClearTiebreakOrderInput {
  tournamentId: string
  blockKey: string
}

interface PlayedResultInput {
  matchId: string
  periods: PeriodScore[]
  playerStats: PlayerBoxScoreInput[]
  mvpTournamentRosterId?: string | null
}

/**
 * Discriminated by resultType (§8.9). The client sends what happened on court and how it
 * ended; the server derives finalScore, result and lossType. The client never sends a score.
 */
export type SubmitMatchResultInput =
  | ({ resultType?: 'NORMAL' } & PlayedResultInput)
  | ({ resultType: 'DEFAULT'; offendingTournamentTeamId: string } & PlayedResultInput)
  | {
      // A W.O. has no game: no periods, no box score, no MVP. Not optional — forbidden.
      resultType: 'FORFEIT'
      matchId: string
      offendingTournamentTeamId: string
    }
