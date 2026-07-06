/**
 * Sports domain — type definitions.
 *
 * ⚠️ TEMPORARY / MOCK DOMAIN
 * The sports domain does not yet exist in the real backend. These types describe
 * the shape we expect the future API to expose so that screens can be built today
 * against local mock data (see `mock-sports-data.ts`). When the API lands, keep these
 * types as the contract and swap the mock source for real fetch calls.
 *
 * Enum *values* are kept in English (consistent with `types/admin.ts`, e.g.
 * `'ACTIVE'`); human-facing Portuguese labels live in `sportsUtils.ts`.
 */

// ── Status enums ────────────────────────────────────────────────────────────

export type TournamentStatus =
  | 'SCHEDULED' // Agendado — ainda não começou
  | 'IN_PROGRESS' // Em andamento — fase classificatória
  | 'PLAYOFFS' // Playoffs — mata-mata em curso
  | 'FINISHED' // Encerrado
  | 'CANCELED' // Cancelado

export type TournamentPhase =
  | 'GROUPS' // Fase de grupos
  | 'ROUNDS_OF_16' // Oitavas de final
  | 'QUARTERS' // Quartas de final
  | 'SEMIS' // Semifinais
  | 'FINAL' // Final
  | 'FINISHED' // Encerrado

export type MatchStatus =
  | 'SCHEDULED' // Agendada
  | 'LIVE' // Ao vivo
  | 'FINISHED' // Finalizada
  | 'POSTPONED' // Adiada

/** Completeness of the statistical record for a match / tournament. */
export type StatsStatus =
  | 'COMPLETE' // Estatísticas completas
  | 'PARTIAL' // Estatísticas incompletas
  | 'PENDING' // Sem estatísticas ainda

/** The only per-leader stat categories allowed this round. */
export type LeaderStat = 'ppg' | 'rpg' | 'apg' | 'stg' | 'bpg'

// ── Core entities ───────────────────────────────────────────────────────────

export interface Team {
  id: string
  name: string
  /** Short tag (3 letters) used in dense tables and bracket cells. */
  shortName: string
  city?: string
}

export type AthletePosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type AthleteStatus = 'ACTIVE' | 'INACTIVE'

export interface Athlete {
  id: string
  name: string
  number: number
  position: AthletePosition
  currentTeamId: string
  status: AthleteStatus
}

export interface StandingRow {
  teamId: string
  position: number
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}

export interface Group {
  id: string
  name: string // 'Grupo A'
  standings: StandingRow[]
}

export interface StatLeader {
  athleteId: string
  athleteName: string
  teamId: string
  /** Per-game average for the category. */
  value: number
  gamesPlayed: number
}

/** Tournament statistical leaders — basic per-game categories only. */
export interface StatLeaders {
  ppg: StatLeader[] // pontos por jogo
  rpg: StatLeader[] // rebotes por jogo
  apg: StatLeader[] // assistências por jogo
  stg: StatLeader[] // roubos por jogo
  bpg: StatLeader[] // tocos por jogo
}

export interface Match {
  id: string
  tournamentId: string
  /** Free-text phase label, e.g. 'Fase de grupos', 'Quartas de final'. */
  phase: string
  date: string // ISO datetime
  homeTeamId: string
  awayTeamId: string
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  venue?: string
  statsStatus: StatsStatus
}

export interface BracketMatch {
  /** Stable id for the bracket slot. */
  id: string
  /** Reference to a real Match, when the confrontation is defined. */
  matchId: string | null
  homeTeamId: string | null
  awayTeamId: string | null
  homeScore: number | null
  awayScore: number | null
  winnerId: string | null
}

export interface BracketRound {
  id: string
  name: string // 'Quartas de final', 'Semifinais', 'Final'
  matches: BracketMatch[]
}

export type TournamentFormat =
  | 'LEAGUE'
  | 'GROUP_STAGE'
  | 'KNOCKOUT'
  | 'GROUP_STAGE_KNOCKOUT'

export type SeasonStatus = 'ACTIVE' | 'ARCHIVED'

/** Time-bounded grouping of tournaments within an organization. */
export interface Season {
  id: string
  /** Free display label: '2025/26' or 'Temporada 2026'. */
  label: string
  startDate: string // ISO date
  endDate: string // ISO date
  status: SeasonStatus
}

/** Controlled division vocabulary per organization (Sub-19, Adulto…). */
export interface TournamentCategory {
  id: string
  name: string
  sortOrder: number
}

export interface Tournament {
  id: string
  name: string
  seasonId: string
  categoryId: string | null
  format: TournamentFormat
  status: TournamentStatus
  currentPhase: TournamentPhase
  teamIds: string[]
  matchCount: number
  finishedMatchCount: number
  startDate: string // ISO date
  endDate: string // ISO date
  updatedAt: string // ISO datetime
  statsStatus: StatsStatus
  /** Short regulation summary (mocked). */
  regulation: string
  groups: Group[]
  leaders: StatLeaders
  bracket: BracketRound[]
  /** Champion team id once the tournament is finished. */
  championTeamId?: string | null
}

// ── Match detail (with per-game box score) ────────────────────────────────────

/** Individual player box-score line for a single match. */
export interface PlayerMatchStats {
  athleteId: string
  athleteName: string
  number: number
  min: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  plusMinus: number
  to: number
  pf: number
  fgm: number
  fga: number
  tpm: number  // 3-pointers made
  tpa: number  // 3-pointers attempted
  ftm: number
  fta: number
}

export type PlayerBoxScore = PlayerMatchStats

/** Aggregated stats for one team in a match. */
export interface TeamMatchStats {
  teamId: string
  players: PlayerMatchStats[]
}

export type TeamStats = TeamMatchStats

export interface AthleteStatTotals {
  games: number
  min: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  to: number
  pf: number
  fgm: number
  fga: number
  tpm: number
  tpa: number
  ftm: number
  fta: number
}

export interface AthleteMatchStatsRow {
  match: Match
  tournament: Tournament
  teamId: string
  matchup: string
  result: string
  stats: PlayerMatchStats
}

export interface AthleteTournamentStatsRow {
  tournament: Tournament
  teamId: string
  totals: AthleteStatTotals
}

/** Score for a single period (regular quarter or overtime).
 *  This is the source of truth for the period breakdown table — do not
 *  use has_ot / number_of_ots as the primary rendering signal. */
export interface PeriodScore {
  /** Sequential period number: 1–4 for regular quarters; 5+ for overtimes. */
  periodNumber: number
  type: 'REGULAR' | 'OVERTIME'
  /** 1 for first OT, 2 for second OT, …  Null for regular periods. */
  overtimeNumber: number | null
  /** Optional API-provided display label. When absent, UI derives 1Q/OT labels. */
  label?: string
  homePoints: number | null
  awayPoints: number | null
}

export interface MatchLeader {
  metric: 'PTS' | 'REB' | 'AST' | 'STL' | 'BLK'
  label: string
  value: number
  athleteId: string
  athleteName: string
  teamId: string
}

/** Match with full box score data. */
export interface MatchDetail extends Match {
  /** Dynamic per-period scores. Drives the "Placar por período" table.
   *  Null when no period data has been recorded yet. */
  periodScores: PeriodScore[] | null
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
}
