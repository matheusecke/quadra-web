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

export type PlayerBoxScoreInput = PlayerStatInput & { athleteId: string; teamId: string }

export interface SubmitMatchResultInput {
  matchId: string
  periods: PeriodScore[]
  playerStats: PlayerBoxScoreInput[]
  mvpAthleteId?: string | null
}
