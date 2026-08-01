import type { TournamentFormat, TournamentStatus } from '../../features/sports/types'

export interface CreateSeasonInput {
  label: string
  startDate: string
  endDate: string
}

export interface CreateCategoryInput {
  name: string
  sortOrder?: number
}

/** Os quatro status que a API aceita em POST e PATCH. `COMPLETED` só vem de `/complete`. */
export type EditableTournamentStatus = Exclude<TournamentStatus, 'COMPLETED'>

export interface CreateTournamentInput {
  name: string
  seasonId: number
  format: TournamentFormat
  categoryId?: number
  regulation?: string
  status?: EditableTournamentStatus
  startsAt?: string
  endsAt?: string
  registrationStartsAt?: string
  registrationEndsAt?: string
}

/** No PATCH, `null` limpa a coluna e `undefined` deixa como está — a diferença importa. */
export interface UpdateTournamentInput {
  name?: string
  seasonId?: number
  format?: TournamentFormat
  categoryId?: number | null
  regulation?: string | null
  status?: EditableTournamentStatus
  startsAt?: string | null
  endsAt?: string | null
  registrationStartsAt?: string | null
  registrationEndsAt?: string | null
}

export interface CompleteTournamentInput {
  tournamentId: number
  championTournamentTeamId: number | null
}

export interface ReopenTournamentInput {
  tournamentId: number
}

/** `number` and `label` go in the body; `tournamentId` is the path. */
export interface CreateBracketRoundInput {
  tournamentId: number
  /** Required by the API, unique among the tournament's active rounds. The UI derives max + 1. */
  number: number
  label?: string | null
}

export interface UpdateBracketRoundInput {
  number?: number
  label?: string | null
}

/** The round goes in the body, not the path — the tournament is inferred from it. */
export interface CreateBracketSlotInput {
  roundId: number
  /** Required by the API, unique among the round's active slots. The UI derives max + 1. */
  position: number
  label?: string | null
  homeTournamentTeamId?: number | null
  awayTournamentTeamId?: number | null
}

/** `roundId` is absent on purpose: moving a slot between rounds means delete and recreate. */
export interface UpdateBracketSlotInput {
  position?: number
  label?: string | null
  homeTournamentTeamId?: number | null
  awayTournamentTeamId?: number | null
}

export interface EnrollTeamInput {
  tournamentId: number
  teamId: number
}

export interface UpdateTournamentTeamInput {
  seed?: number | null
}

export interface CreateGroupInput {
  tournamentId: number
  name: string
}

export interface UpdateGroupInput {
  name: string
}

export interface AssignGroupTeamInput {
  tournamentGroupId: number
  tournamentTeamId: number
}

export interface CreateTournamentRosterInput {
  userId: number
  tournamentTeamId: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  jerseyNumber?: number | null
}

export interface UpdateTournamentRosterInput {
  role?: 'ATHLETE' | 'COACHING_STAFF'
  jerseyNumber?: number | null
}

/** The whole tied block, every time: `order` is a complete permutation of `1..n`. */
export interface SetTiebreakOrderInput {
  tournamentId: number
  entries: { tournamentTeamId: number; order: number }[]
}

export interface ClearTiebreakOrderInput {
  tournamentId: number
  blockKey: string
}
