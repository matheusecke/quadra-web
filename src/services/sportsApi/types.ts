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

export type UpdateTournamentInput = Partial<CreateTournamentInput> & { status?: TournamentStatus }

export interface EnrollTeamInput {
  tournamentId: string
  teamId: string
  seed?: number
}

export interface RosterEntryInput {
  tournamentId: string
  teamId: string
  athleteId: string
  jerseyNumber: number
  role: 'ATHLETE' | 'COACHING_STAFF'
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
