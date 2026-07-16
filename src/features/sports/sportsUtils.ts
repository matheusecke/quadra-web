/**
 * Sports domain — pure helpers, labels and statistic calculations.
 *
 * ⚠️ No data here, only functions. Safe to keep as-is when the real API lands.
 */

import type {
  AthleteStatTotals,
  AthleteStatus,
  Tournament,
  TournamentFormat,
  TournamentStatus,
  LeaderStat,
  Match,
  MatchStatus,
  PlayerMatchStats,
  PeriodScore,
  StandingRow,
  StatsStatus,
  Team,
} from './types'
import type { BracketRound, BracketSlot } from '../../services/sportsApi/store'

// ── Standings formatting ────────────────────────────────────────────────────
// The ranking rule lives in the data layer (services/sportsApi/standings.ts, FIBA
// Appendix D). Rows arrive ranked, with pointDiff and winPct already resolved —
// recomputing them here would be the client re-deriving a server decision.

/** Format a win percentage as a `.XXX` string, basketball convention. `—` when unmeasured. */
export function formatPct(row: StandingRow): string {
  if (row.winPct === null) return '—'
  return row.winPct.toFixed(3).replace(/^0/, '')
}

/** Format a signed point differential, e.g. `+42`, `-8`, `0`. */
export function formatDiff(row: StandingRow): string {
  return row.pointDiff > 0 ? `+${row.pointDiff}` : `${row.pointDiff}`
}

// ── Match helpers ─────────────────────────────────────────────────────────────

/** Most recent first. */
export function sortMatchesByDateDesc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

export function isFinished(match: Match): boolean {
  return match.status === 'FINISHED'
}

/** Phase label derived from the real links — never free text on the match. */
export function matchPhaseName(
  match: Pick<Match, 'bracketRound' | 'tournamentGroupId'>,
): string | null {
  if (match.bracketRound) return match.bracketRound.label
  return match.tournamentGroupId ? 'Fase de grupos' : null
}

// ── Team lookups ──────────────────────────────────────────────────────────────

export function teamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((t) => [t.id, t]))
}

// ── Labels (Portuguese) ────────────────────────────────────────────────────────

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Rascunho',
  REGISTRATION: 'Inscrições',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Encerrado',
  CANCELLED: 'Cancelado',
}

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  LEAGUE: 'Pontos corridos',
  GROUP_STAGE: 'Fase de grupos',
  KNOCKOUT: 'Mata-mata',
  GROUP_STAGE_KNOCKOUT: 'Grupos + mata-mata',
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'Agendada',
  LIVE: 'Ao vivo',
  FINISHED: 'Finalizada',
  POSTPONED: 'Adiada',
  CANCELLED: 'Cancelada',
}

export const STATS_STATUS_LABELS: Record<StatsStatus, string> = {
  COMPLETE: 'Estatísticas completas',
  PARTIAL: 'Estatísticas incompletas',
  PENDING: 'Sem estatísticas',
}

export const ATHLETE_STATUS_LABELS: Record<AthleteStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
}

export const LEADER_STAT_META: Record<LeaderStat, { label: string; full: string }> = {
  ppg: { label: 'PPG', full: 'Pontos por jogo' },
  rpg: { label: 'RPG', full: 'Rebotes por jogo' },
  apg: { label: 'APG', full: 'Assistências por jogo' },
  stg: { label: 'STG', full: 'Roubos por jogo' },
  bpg: { label: 'BPG', full: 'Tocos por jogo' },
}

/** Fixed display order for the allowed leader categories. */
export const LEADER_STAT_ORDER: LeaderStat[] = ['ppg', 'rpg', 'apg', 'stg', 'bpg']

// ── Badge variant mapping (matches Badge component variants) ────────────────────

type BadgeVariant = 'default' | 'accent' | 'live' | 'success' | 'warning' | 'danger' | 'ghost'

export function tournamentStatusVariant(status: TournamentStatus): BadgeVariant {
  switch (status) {
    case 'IN_PROGRESS':
      return 'accent'
    case 'REGISTRATION':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    case 'DRAFT':
    default:
      return 'ghost'
  }
}

export function matchStatusVariant(status: MatchStatus): BadgeVariant {
  switch (status) {
    case 'LIVE':
      return 'live'
    case 'FINISHED':
      return 'success'
    case 'POSTPONED':
      return 'warning'
    case 'CANCELLED':
      return 'danger'
    case 'SCHEDULED':
    default:
      return 'ghost'
  }
}

export function statsStatusVariant(status: StatsStatus): BadgeVariant {
  switch (status) {
    case 'COMPLETE':
      return 'success'
    case 'PARTIAL':
      return 'warning'
    case 'PENDING':
    default:
      return 'default'
  }
}

// ── Date formatting (pt-BR) ─────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const dateShortFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

export function formatDateShort(iso: string): string {
  return dateShortFmt.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

/** Compact relative-ish "última atualização" string. */
export function formatRelative(iso: string): string {
  const diffMs = Date.now() - +new Date(iso)
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `há ${days} d`
  return formatDate(iso)
}

/** `realizadas/total` progress string, e.g. `12/18`. */
export function matchProgress(tournament: Tournament): string {
  return `${tournament.finishedMatchCount}/${tournament.matchCount}`
}

export function formatPeriod(tournament: Tournament): string {
  return `${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`
}

const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso))
}

/** Derives the column label for a period: 1Q-4Q for regular, OT / 2OT / 3OT for overtime. */
export function getPeriodLabel(period: PeriodScore): string {
  if (period.label) return period.label
  if (period.type === 'REGULAR') return `${period.periodNumber}Q`
  const overtimeNumber = period.overtimeNumber ?? 1
  return overtimeNumber === 1 ? 'OT' : `${overtimeNumber}OT`
}

/** Safely totals one side from the dynamic period score list, ignoring null periods. */
export function calculatePeriodTotal(periods: PeriodScore[] | null, side: 'home' | 'away'): number | null {
  if (!periods?.length) return null
  const key = side === 'home' ? 'homePoints' : 'awayPoints'
  return periods.reduce<number>((sum, period) => sum + (period[key] ?? 0), 0)
}

// ── Per-match stat helpers ─────────────────────────────────────────────────────

/** Percentage with 1 decimal. Returns '—' when denominator is 0. */
export function formatStatPct(made: number, attempted: number): string {
  if (attempted === 0) return '—'
  return ((made / attempted) * 100).toFixed(1)
}

/** True-Shooting % string. */
export function formatTsPct(pts: number, fga: number, fta: number): string {
  const denom = 2 * (fga + 0.44 * fta)
  if (denom === 0) return '—'
  return ((pts / denom) * 100).toFixed(1)
}

/** EFF / EFI rating. */
export function calcEff(p: PlayerMatchStats): number {
  return (
    p.pts + p.reb + p.ast + p.stl + p.blk
    - (p.fga - p.fgm)
    - (p.fta - p.ftm)
    - p.to
  )
}

export function calcEffFromTotals(totals: AthleteStatTotals): number {
  return (
    totals.pts + totals.reb + totals.ast + totals.stl + totals.blk
    - (totals.fga - totals.fgm)
    - (totals.fta - totals.ftm)
    - totals.to
  )
}

export function emptyAthleteTotals(): AthleteStatTotals {
  return {
    games: 0,
    min: 0,
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    to: 0,
    pf: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
  }
}

export function aggregateAthleteStats(players: PlayerMatchStats[]): AthleteStatTotals {
  return players.reduce((acc, p) => ({
    games: acc.games + 1,
    min: acc.min + p.min,
    pts: acc.pts + p.pts,
    reb: acc.reb + p.reb,
    ast: acc.ast + p.ast,
    stl: acc.stl + p.stl,
    blk: acc.blk + p.blk,
    to: acc.to + p.to,
    pf: acc.pf + p.pf,
    fgm: acc.fgm + p.fgm,
    fga: acc.fga + p.fga,
    tpm: acc.tpm + p.tpm,
    tpa: acc.tpa + p.tpa,
    ftm: acc.ftm + p.ftm,
    fta: acc.fta + p.fta,
  }), emptyAthleteTotals())
}

export function perGame(value: number, games: number): number {
  return games === 0 ? 0 : value / games
}

export interface TeamStatTotals {
  min: number; pts: number; reb: number; ast: number; stl: number; blk: number
  to: number; pf: number; fgm: number; fga: number; tpm: number; tpa: number
  ftm: number; fta: number
}

export function aggregateTeamStats(players: PlayerMatchStats[]): TeamStatTotals {
  const z: TeamStatTotals = { min:0,pts:0,reb:0,ast:0,stl:0,blk:0,to:0,pf:0,fgm:0,fga:0,tpm:0,tpa:0,ftm:0,fta:0 }
  return players.reduce((acc, p) => ({
    min: acc.min + p.min, pts: acc.pts + p.pts, reb: acc.reb + p.reb,
    ast: acc.ast + p.ast, stl: acc.stl + p.stl, blk: acc.blk + p.blk,
    to:  acc.to  + p.to,  pf:  acc.pf  + p.pf,  fgm: acc.fgm + p.fgm,
    fga: acc.fga + p.fga, tpm: acc.tpm + p.tpm, tpa: acc.tpa + p.tpa,
    ftm: acc.ftm + p.ftm, fta: acc.fta + p.fta,
  }), z)
}

/** Derived display status — surfaces 'Aguardando estatísticas' case. */
export function matchDisplayStatus(status: MatchStatus, statsStatus: StatsStatus): string {
  if (status === 'FINISHED' && statsStatus === 'PENDING') return 'Aguardando estatísticas'
  return MATCH_STATUS_LABELS[status]
}

export function matchDisplayStatusVariant(status: MatchStatus, statsStatus: StatsStatus): BadgeVariant {
  if (status === 'FINISHED' && statsStatus === 'PENDING') return 'warning'
  return matchStatusVariant(status)
}

export function slotDisplayName(slot: Pick<BracketSlot, 'label' | 'position'>, round: Pick<BracketRound, 'label'>): string {
  if (slot.label) return slot.label
  return round.label ? `${round.label} ${slot.position}` : `Vaga ${slot.position}`
}

export function roundDisplayName(round: Pick<BracketRound, 'label' | 'number'>): string {
  return round.label ?? `Rodada ${round.number}`
}
