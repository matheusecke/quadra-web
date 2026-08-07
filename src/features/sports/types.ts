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

export interface AthleteProfile {
  id: number
  name: string
  currentTeamId: number | null
  jerseyNumber: number | null
  position: AthletePosition | null
  status: AthleteStatus
}

export type AthleteMetricValues = Record<StatField, number | null>
export type AthleteMetricMeasurements = Record<StatField, number>

export interface AthleteStatistics {
  gamesPlayed: number
  measuredGames: AthleteMetricMeasurements
  totals: AthleteMetricValues
  perGame: AthleteMetricValues
  shooting: {
    fgPct: number | null
    threeFgPct: number | null
    ftPct: number | null
    trueShootingPct: number | null
  }
  efficiency: {
    measuredGames: number
    total: number | null
    perGame: number | null
  }
}

export type AthleteResult = 'WIN' | 'LOSS'

export interface AthleteMatchHistoryRow {
  match: { id: number; scheduledAt: string }
  tournament: { id: number; name: string }
  athleteName: string
  team: { tournamentTeamId: number; teamId: number; name: string }
  opponent: { tournamentTeamId: number; teamId: number; name: string }
  result: {
    result: AthleteResult
    lossType: LossType | null
    pointsFor: number
    pointsAgainst: number
  }
  stats: { tournamentRosterId: number } & AthleteMetricValues
  derived: {
    fgPct: number | null
    threeFgPct: number | null
    ftPct: number | null
    trueShootingPct: number | null
    efficiency: number | null
  }
}

export interface AthleteTournamentHistoryRow {
  tournament: { id: number; name: string; seasonId: number; startsAt: string | null }
  team: { tournamentTeamId: number; teamId: number; name: string }
  statistics: AthleteStatistics
}

export interface TournamentLeader {
  athleteId: number
  athleteName: string
  tournamentTeamId: number
  teamId: number
  teamName: string
  value: number
  gamesPlayed: number
}

export interface TournamentLeaders {
  perGame: Record<'ppg' | 'rpg' | 'apg' | 'stg' | 'bpg', TournamentLeader[]>
  totals: Record<'pts' | 'reb' | 'ast' | 'stl' | 'blk', TournamentLeader[]>
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

/** Why the loser lost. Drives FIBA classification points: NORMAL/DEFAULT = 1, FORFEIT = 0. */
export type LossType = 'NORMAL' | 'DEFAULT' | 'FORFEIT'

export type MatchSideResult = 'WIN' | 'LOSS'
export type MatchScoreSource = 'PERIODS' | 'AWARDED'

export interface MatchSide {
  tournamentTeamId: number
  teamName: string
  score: number | null
  result: MatchSideResult | null
  lossType: LossType | null
  isWinner: boolean | null
}

export interface MatchBracketRound {
  id: number
  number: number
  label: string | null
}

export interface MatchSummary {
  id: number
  tournamentId: number
  tournamentGroupId: number | null
  matchNumber: number | null
  status: MatchStatus
  scheduledAt: string
  startedAt: string | null
  endedAt: string | null
  venueName: string | null
  bracketRound: MatchBracketRound | null
  scoreSource: MatchScoreSource | null
  homeTeam: MatchSide
  awayTeam: MatchSide
}

export interface MatchPeriod {
  periodNumber: number
  periodType: 'REGULAR' | 'OVERTIME'
  homePoints: number
  awayPoints: number
  startedAt: string | null
  endedAt: string | null
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

export interface BracketSlotTeam {
  tournamentTeamId: number
  /** Registration snapshot. A renamed team keeps the historical name here. */
  name: string
  /** Read live from the catalogue — deliberately not a snapshot. */
  shortName: string
}

export interface BracketMatchView {
  id: number
  status: MatchStatus
  date: string | null
  homeScore: number | null
  awayScore: number | null
}

export interface BracketSlotView {
  id: number
  /** Copied from the parent round while flattening. */
  roundId: number
  position: number
  label: string | null
  homeTeam: BracketSlotTeam | null
  awayTeam: BracketSlotTeam | null
  match: BracketMatchView | null
  winnerTournamentTeamId: number | null
}

// ── Match detail (with per-game box score) ────────────────────────────────────

/** Individual player box-score line for a single match. */
export interface PlayerMatchStats {
  tournamentRosterId: number
  tournamentTeamId: number
  displayName: string
  pts: number | null
  fgm: number | null
  fga: number | null
  threeFgm: number | null
  threeFga: number | null
  ftm: number | null
  fta: number | null
  reb: number | null
  ast: number | null
  stl: number | null
  blk: number | null
  tov: number | null
  pf: number | null
  minutesSeconds: number | null
}

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

/** Curated award, chosen by the ORG_ADMIN — not derived from statistics. DB spec §8.10. */
export interface MatchMvp {
  tournamentRosterId: number
  displayName: string
}

/** Match with full box score data. */
export interface MatchDetail extends MatchSummary {
  periods: MatchPeriod[]
  playerStats: PlayerMatchStats[]
  /** null on a W.O. and until the admin picks one. §8.10 */
  mvp: MatchMvp | null
}

// ── Team profile (GET /teams/:id/summary | /matches | /tournaments) ──────────
// Averages, rates and measured-game metadata only. The API exposes no team totals.

/** Contextual status derived by the API from the global entity plus organization visibility. */
export type TeamProfileStatus = 'ACTIVE' | 'HISTORICAL' | 'INACTIVE'

/** TournamentTeam participation status. */
export type TournamentTeamStatus = 'ACTIVE' | 'WITHDRAWN'

export type TeamMatchScope = 'upcoming' | 'history'

export type TeamBoxScoreField = 'reb' | 'ast' | 'stl' | 'blk' | 'tov' | 'pf'

export interface TeamProfileIdentity {
  id: number
  name: string
  shortName: string
  city: string | null
  /** Two-letter Brazilian state code, e.g. 'SP'. */
  state: string | null
  status: TeamProfileStatus
}

export interface TeamTitle {
  tournament: {
    id: number
    name: string
    seasonId: number
    seasonLabel: string
    startsAt: string | null
    endsAt: string | null
  }
}

export interface TeamResultStatistics {
  /** Denominator metadata for winRate — reliability annotation, never a headline total. */
  measuredGames: number
  winRate: number | null
  scoreMeasuredGames: number
  pointsForPerGame: number | null
  pointsAgainstPerGame: number | null
  pointDiffPerGame: number | null
}

export interface TeamBoxScoreStatistics {
  /** Each metric carries its own denominator; a recorded zero stays measured. */
  measuredGames: Record<TeamBoxScoreField, number>
  perGame: Record<TeamBoxScoreField, number | null>
  shooting: {
    fgPct: number | null
    threeFgPct: number | null
    ftPct: number | null
    trueShootingPct: number | null
  }
  efficiency: { measuredGames: number; perGame: number | null }
}

export interface TeamStatistics {
  results: TeamResultStatistics
  boxScore: TeamBoxScoreStatistics
}

export interface TeamSummary {
  team: TeamProfileIdentity
  titles: TeamTitle[]
  statistics: TeamStatistics
}

export interface TeamMatchParticipant {
  tournamentTeamId: number
  /** Global Team.id — the navigation target. */
  teamId: number
  /** TournamentTeam.displayNameSnapshot — the historical label. */
  name: string
  score: number | null
  result: MatchSideResult | null
  lossType: LossType | null
  isWinner: boolean | null
}

export interface TeamMatchHistoryRow {
  match: {
    id: number
    status: MatchStatus
    scheduledAt: string
    venueName: string | null
    scoreSource: MatchScoreSource | null
  }
  tournament: { id: number; name: string; seasonId: number; seasonLabel: string }
  team: TeamMatchParticipant
  opponent: TeamMatchParticipant
}

export interface TeamTournamentHistoryRow {
  tournament: {
    id: number
    name: string
    seasonId: number
    seasonLabel: string
    status: TournamentStatus
    startsAt: string | null
    endsAt: string | null
  }
  team: {
    tournamentTeamId: number
    teamId: number
    name: string
    status: TournamentTeamStatus
    isChampion: boolean
  }
  statistics: TeamStatistics
}
