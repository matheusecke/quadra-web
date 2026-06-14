/**
 * Sports domain — type definitions.
 *
 * ⚠️ TEMPORARY / MOCK DOMAIN
 * The sports domain does not yet exist in the real backend. These types describe
 * the shape we expect the future API to expose so that screens can be built today
 * against local mock data (see `mockSportsData.ts`). When the API lands, keep these
 * types as the contract and swap the mock source for real fetch calls.
 *
 * Enum *values* are kept in English (consistent with `types/admin.ts`, e.g.
 * `'ACTIVE'`); human-facing Portuguese labels live in `sportsUtils.ts`.
 */

// ── Status enums ────────────────────────────────────────────────────────────

export type ChampionshipStatus =
  | 'SCHEDULED' // Agendado — ainda não começou
  | 'IN_PROGRESS' // Em andamento — fase classificatória
  | 'PLAYOFFS' // Playoffs — mata-mata em curso
  | 'FINISHED' // Encerrado
  | 'CANCELED' // Cancelado

export type ChampionshipPhase =
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

/** Completeness of the statistical record for a match / championship. */
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

/** Championship statistical leaders — basic per-game categories only. */
export interface StatLeaders {
  ppg: StatLeader[] // pontos por jogo
  rpg: StatLeader[] // rebotes por jogo
  apg: StatLeader[] // assistências por jogo
  stg: StatLeader[] // roubos por jogo
  bpg: StatLeader[] // tocos por jogo
}

export interface Match {
  id: string
  championshipId: string
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

export interface Championship {
  id: string
  name: string
  season: string // '2025/26'
  category: string // 'Adulto Masculino', 'Sub-19', ...
  status: ChampionshipStatus
  currentPhase: ChampionshipPhase
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
  /** Champion team id once the championship is finished. */
  championTeamId?: string | null
}
