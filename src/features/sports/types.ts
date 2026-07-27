/**
 * Sports domain — type definitions.
 *
 * Enum *values* are kept in English (consistent with `types/admin.ts`, e.g.
 * `'ACTIVE'`); human-facing Portuguese labels live in `sportsUtils.ts`.
 */

import type { EntityStatus } from '../../types/admin'
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
  id: number
  name: string
  /** Short tag (3 letters) used in dense tables and bracket cells. */
  shortName: string
  city?: string | null
}

/** GET /athletes — a catalog of users eligible for a roster, not an athlete's sports detail. */
export interface RosterCandidate {
  id: number // User.id
  name: string
  teamId: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  jerseyNumber: number | null
}

export type AthletePosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type AthleteStatus = 'ACTIVE' | 'INACTIVE'

export interface Athlete {
  id: number
  name: string
  number: number
  position: AthletePosition | null
  currentTeamId: number
  status: AthleteStatus
}

export type StandingsState = 'EMPTY' | 'PARTIAL' | 'FINAL'

/** One row of a classification table, ranked by the server. The UI never re-orders it. §8.7 */
export interface StandingRow {
  /** null if and only if standingsState === 'EMPTY'. */
  position: number | null
  tournamentTeamId: number
  teamId: number
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
  group: { id: number; name: string } | null
  standingsState: StandingsState
  pendingMatches: number
  rows: StandingRow[]
}

export interface StatLeader {
  athleteId: number
  athleteName: string
  tournamentTeamId: number
  /** Global team id — legit catalog metadata, kept alongside the identity field. */
  teamId: number
  /** Per-game average for the category. */
  value: number | null
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
  id: number
  tournamentId: number
  date: string // ISO datetime
  homeTournamentTeamId: number
  awayTournamentTeamId: number
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  venue?: string
  /** Set when the match belongs to a group stage; null for league and knockout games. */
  tournamentGroupId: number | null
  /**
   * Knockout round derived via match → bracket slot → round. Null outside the bracket.
   * Mutually exclusive with tournamentGroupId by construction.
   */
  bracketRound: { id: number; number: number; label: string | null } | null
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
  id: number
  /** Free display label: '2025/26' or 'Temporada 2026'. */
  label: string
  startDate: string // ISO date
  endDate: string // ISO date
  status: SeasonStatus
}

/** Controlled division vocabulary per organization (Sub-19, Adulto…). */
export interface TournamentCategory {
  id: number
  name: string
  /** null quando não há ordem manual — a API ordena com NULLS LAST, o cliente não reordena. */
  sortOrder: number | null
  status: EntityStatus
}

export interface Tournament {
  id: number
  name: string
  seasonId: number
  categoryId: number | null
  regulation: string | null
  format: TournamentFormat
  status: TournamentStatus
  /** Instantes ISO-8601 completos (`timestamptz`), não dia-calendário como em `Season`. */
  startsAt: string | null
  endsAt: string | null
  registrationStartsAt: string | null
  registrationEndsAt: string | null
  /** Deriva só da janela de inscrição. Janela vazia é fechada, nunca "aberta para sempre". */
  isRegistrationOpen: boolean
  /** Inscrição campeã (`TournamentTeam`), nunca um `Team`. Nula enquanto não há título. */
  championTournamentTeamId: number | null
  enrolledTeamCount: number
  matchCount: number
  finishedMatchCount: number
  updatedAt: string
}

export interface TournamentTeam {
  id: number
  tournamentId: number
  teamId: number
  /** The team's name at enrollment. Survives a later rename (DB spec §5.3). */
  displayNameSnapshot: string
  seed: number | null
  /** The recorded draw (FIBA's last criterion) and the block it was recorded for. §8.8 */
  tiebreakOrder: number | null
  tiebreakBlockKey: string | null
}

export interface TournamentGroup {
  id: number
  tournamentId: number
  name: string
  /** Ordem do servidor. A lista já vem ordenada; o cliente nunca reordena. */
  sortOrder: number | null
}

export interface TournamentGroupTeam {
  id: number
  tournamentId: number
  tournamentGroupId: number
  tournamentTeamId: number
}

export interface RosterEntry {
  id: number
  tournamentId: number
  tournamentTeamId: number
  athleteId: number
  jerseyNumber: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  isDeleted?: boolean
}

export type RosterRole = 'ATHLETE' | 'COACHING_STAFF'

export interface TournamentRoster {
  id: number
  tournamentId: number
  tournamentTeamId: number
  userId: number
  role: RosterRole
  jerseyNumber: number | null
  displayNameSnapshot: string
}

export interface BracketRound {
  id: number
  tournamentId: number
  /** 1 = primeira rodada do mata-mata. Ordenação, não contagem. */
  number: number
  /** 'Quartas de final', 'Semifinais', 'Final'. Livre, escrito pelo admin. */
  label: string | null
  isDeleted?: boolean
}

export interface BracketSlot {
  id: number
  tournamentId: number
  roundId: number
  position: number
  label: string | null
  homeTournamentTeamId: number | null
  awayTournamentTeamId: number | null
  matchId: number | null
  winnerTournamentTeamId: number | null
  isDeleted?: boolean
}

// ── Match detail (with per-game box score) ────────────────────────────────────

/** Individual player box-score line for a single match. */
export interface PlayerMatchStats {
  tournamentRosterId: number
  athleteId: number
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
  tournamentTeamId: number
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
  tournamentTeamId: number
  /** Display snapshot — cheaper than joining a per-tournament TournamentTeam[] across many tournaments. */
  teamName: string
  matchup: string
  result: string
  stats: PlayerMatchStats
}

export interface AthleteTournamentStatsRow {
  tournament: Tournament
  tournamentTeamId: number
  /** Display snapshot — cheaper than joining a per-tournament TournamentTeam[] across many tournaments. */
  teamName: string
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
  athleteId: number
  athleteName: string
  tournamentTeamId: number
  /** Global team id — legit catalog metadata, kept alongside the identity field. */
  teamId: number
}

/** Curated award, chosen by the ORG_ADMIN — not derived from statistics. DB spec §8.10. */
export interface MatchMvp {
  tournamentRosterId: number
  athleteId: number
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
