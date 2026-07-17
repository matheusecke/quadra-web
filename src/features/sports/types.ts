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

import type { StatField } from './statistics'

// ── Status enums ────────────────────────────────────────────────────────────

export type TournamentStatus =
  | 'DRAFT' // Rascunho — sendo montado, invisível para a organização
  | 'REGISTRATION' // Inscrições — pré-competição: elenco, grupos e calendário
  | 'IN_PROGRESS' // Em andamento — a bola rolou
  | 'COMPLETED' // Encerrado
  | 'CANCELLED' // Cancelado

export type MatchStatus =
  | 'SCHEDULED' // Agendada
  | 'LIVE' // Ao vivo
  | 'FINISHED' // Finalizada
  | 'POSTPONED' // Adiada — vai acontecer; conta como pendente
  | 'CANCELLED' // Cancelada — nunca vai acontecer; NÃO conta como pendente

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
  position: AthletePosition | null
  currentTeamId: string
  status: AthleteStatus
}

export type StandingsState = 'EMPTY' | 'PARTIAL' | 'FINAL'

/** One row of a classification table, ranked by the server. The UI never re-orders it. §8.7 */
export interface StandingRow {
  /** null if and only if standingsState === 'EMPTY'. */
  position: number | null
  tournamentTeamId: string
  teamId: string
  /** display_name_snapshot — the name at enrollment time. */
  teamName: string
  played: number
  wins: number
  losses: number
  /** FIBA D.1.1: 2 win / 1 loss / 0 loss by W.O. This is the ordering criterion. */
  classificationPoints: number
  pointsFor: number
  pointsAgainst: number
  pointDiff: number
  /** null whenever played === 0 — never 0. Display only, never an ordering key. */
  winPct: number | null
  /** Every criterion was exhausted and no draw is recorded for this block. */
  isTiedUnresolved: boolean
  /** Shared by every row of the same tie block, resolved or not. null outside a block. */
  tieBlockKey: string | null
}

/** One classification table: a group, or the whole tournament in LEAGUE. §8.7 */
export interface StandingsEnvelope {
  group: { id: string; name: string } | null
  standingsState: StandingsState
  pendingMatches: number
  rows: StandingRow[]
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

/** Why the loser lost. Drives FIBA classification points: NORMAL/DEFAULT = 1, FORFEIT = 0. */
export type LossType = 'NORMAL' | 'DEFAULT' | 'FORFEIT'

/**
 * Where the final score came from (DB spec §8.9).
 * 'PERIODS' is the sum of the periods; 'AWARDED' is assigned by the rules.
 * null means the match is not finished yet.
 */
export type ScoreSource = 'PERIODS' | 'AWARDED' | null

export interface Match {
  id: string
  tournamentId: string
  date: string // ISO datetime
  homeTeamId: string
  awayTeamId: string
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  venue?: string
  /** Set when the match belongs to a group stage; null for league and knockout games. */
  tournamentGroupId: string | null
  /**
   * Knockout round derived via match → bracket slot → round. Null outside the bracket.
   * Mutually exclusive with tournamentGroupId by construction.
   */
  bracketRound: { id: string; number: number; label: string | null } | null
  /** Set on the losing side only; null on the winner and while unfinished. §8.10 */
  homeLossType: LossType | null
  awayLossType: LossType | null
  /** null while the match is not FINISHED. §8.9 */
  scoreSource: ScoreSource
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
  teamIds: string[]
  matchCount: number
  finishedMatchCount: number
  startDate: string // ISO date
  endDate: string // ISO date
  updatedAt: string // ISO datetime
  /** Short regulation summary (mocked). */
  regulation: string
  leaders: StatLeaders
  /** Explicit declared tournament-team champion, null while no title is declared. */
  championTournamentTeamId: string | null
}

export interface TournamentTeam {
  id: string
  tournamentId: string
  teamId: string
  /** The team's name at enrollment. Survives a later rename (DB spec §5.3). */
  displayNameSnapshot: string
  seed: number | null
  /** The recorded draw (FIBA's last criterion) and the block it was recorded for. §8.8 */
  tiebreakOrder: number | null
  tiebreakBlockKey: string | null
  isDeleted?: boolean
}

export interface TournamentGroup {
  id: string
  tournamentId: string
  name: string
  sortOrder: number
  isDeleted?: boolean
}

export interface TournamentGroupTeam {
  id: string
  tournamentId: string
  groupId: string
  teamId: string
  isDeleted?: boolean
}

export interface RosterEntry {
  id: string
  tournamentId: string
  teamId: string
  athleteId: string
  jerseyNumber: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  isDeleted?: boolean
}

export interface BracketRound {
  id: string
  tournamentId: string
  /** 1 = primeira rodada do mata-mata. Ordenação, não contagem. */
  number: number
  /** 'Quartas de final', 'Semifinais', 'Final'. Livre, escrito pelo admin. */
  label: string | null
  isDeleted?: boolean
}

export interface BracketSlot {
  id: string
  tournamentId: string
  roundId: string
  position: number
  label: string | null
  homeTournamentTeamId: string | null
  awayTournamentTeamId: string | null
  matchId: string | null
  winnerTournamentTeamId: string | null
  isDeleted?: boolean
}

// ── Match detail (with per-game box score) ────────────────────────────────────

/** Individual player box-score line for a single match. */
export interface PlayerMatchStats {
  tournamentRosterId: string
  athleteId: string
  athleteName: string
  number: number
  minutesSeconds: number | null
  pts: number | null
  reb: number | null
  ast: number | null
  stl: number | null
  blk: number | null
  tov: number | null
  pf: number | null
  fgm: number | null
  fga: number | null
  threeFgm: number | null  // 3-pointers made
  threeFga: number | null  // 3-pointers attempted
  ftm: number | null
  fta: number | null
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
  measuredGames: Record<StatField, number>
  minutesSeconds: number | null
  pts: number | null
  reb: number | null
  ast: number | null
  stl: number | null
  blk: number | null
  tov: number | null
  pf: number | null
  fgm: number | null
  fga: number | null
  threeFgm: number | null
  threeFga: number | null
  ftm: number | null
  fta: number | null
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

/** Curated award, chosen by the ORG_ADMIN — not derived from statistics. DB spec §8.10. */
export interface MatchMvp {
  tournamentRosterId: string
  athleteId: string
}

/** Match with full box score data. */
export interface MatchDetail extends Match {
  /** Dynamic per-period scores. Drives the "Placar por período" table.
   *  Null when no period data has been recorded yet. */
  periodScores: PeriodScore[] | null
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
  /** null on a W.O. and until the admin picks one. §8.10 */
  mvp: MatchMvp | null
}
