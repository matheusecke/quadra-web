/**
 * Sports domain — pure helpers, labels and statistic calculations.
 *
 * ⚠️ No data here, only functions. Safe to keep as-is when the real API lands.
 */

import type {
  AthleteStatTotals,
  AthleteStatus,
  BracketRound,
  BracketSlot,
  Tournament,
  TournamentFormat,
  TournamentStatus,
  LeaderStat,
  MatchStatus,
  MatchSummary,
  PlayerMatchStats,
  PeriodScore,
  StandingRow,
  Team,
  TournamentTeam,
} from './types'
import { STAT_FIELDS, sumNullable, type StatField } from './statistics'

// ── Standings formatting ────────────────────────────────────────────────────
// The ranking rule lives in the API (GET /tournaments/:id/standings, FIBA Appendix D).
// Rows arrive ranked, with pointDiff and winPct already resolved — recomputing them here
// would be the client re-deriving a server decision.

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

export function hasKnockout(format: TournamentFormat): boolean {
  return format === 'KNOCKOUT' || format === 'GROUP_STAGE_KNOCKOUT'
}

/** Phase label derived from the real links — never free text on the match. */
export function matchPhaseName(
  match: Pick<MatchSummary, 'bracketRound' | 'tournamentGroupId'>,
): string | null {
  if (match.bracketRound) return match.bracketRound.label
  return match.tournamentGroupId ? 'Fase de grupos' : null
}

// ── Team lookups ──────────────────────────────────────────────────────────────

export function teamMap(teams: Team[]): Map<number, Team> {
  return new Map(teams.map((t) => [t.id, t]))
}

export function tournamentTeamMap(
  tournamentTeams: TournamentTeam[],
  teams: Map<number, Team>,
): Map<number, { name: string; shortName: string }> {
  return new Map(
    tournamentTeams.map((entry) => [
      entry.id,
      { name: entry.displayNameSnapshot, shortName: teams.get(entry.teamId)?.shortName ?? '' },
    ]),
  )
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

/** Rascunho sem data é normal — a API ordena com NULLS FIRST justamente por isso. */
export function formatPeriod(tournament: Tournament): string {
  const { startsAt, endsAt } = tournament
  if (!startsAt && !endsAt) return '—'
  if (!endsAt) return `A partir de ${formatDate(startsAt!)}`
  if (!startsAt) return `Até ${formatDate(endsAt)}`
  return `${formatDate(startsAt)} - ${formatDate(endsAt)}`
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
export function formatStatPct(made: number | null, attempted: number | null): string {
  if (made === null || attempted === null) return 'N/A'
  if (attempted === 0) return '—'
  return ((made / attempted) * 100).toFixed(1)
}

/** True-Shooting % string. */
export function formatTsPct(pts: number | null, fga: number | null, fta: number | null): string {
  if (pts === null || fga === null || fta === null) return 'N/A'
  const denom = 2 * (fga + 0.44 * fta)
  if (denom === 0) return '—'
  return ((pts / denom) * 100).toFixed(1)
}

export function formatMinutesSeconds(totalSeconds: number | null): string {
  if (totalSeconds === null) return 'N/A'
  const roundedSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = String(roundedSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

/** EFF / EFI rating. */
export function calcEff(p: PlayerMatchStats): number | null {
  const parts = [p.pts, p.reb, p.ast, p.stl, p.blk, p.fga, p.fgm, p.fta, p.ftm, p.tov]
  if (parts.some((value) => value === null)) return null
  return (
    (p.pts as number) + (p.reb as number) + (p.ast as number) + (p.stl as number) + (p.blk as number)
    - ((p.fga as number) - (p.fgm as number))
    - ((p.fta as number) - (p.ftm as number))
    - (p.tov as number)
  )
}

export function calcEffFromTotals(totals: AthleteStatTotals): number | null {
  const parts = [totals.pts, totals.reb, totals.ast, totals.stl, totals.blk, totals.fga, totals.fgm, totals.fta, totals.ftm, totals.tov]
  if (parts.some((value) => value === null)) return null
  return (
    (totals.pts as number) + (totals.reb as number) + (totals.ast as number) + (totals.stl as number) + (totals.blk as number)
    - ((totals.fga as number) - (totals.fgm as number))
    - ((totals.fta as number) - (totals.ftm as number))
    - (totals.tov as number)
  )
}

export function emptyAthleteTotals(): AthleteStatTotals {
  const measuredGames = Object.fromEntries(STAT_FIELDS.map((field) => [field, 0])) as Record<StatField, number>
  const totals = Object.fromEntries(STAT_FIELDS.map((field) => [field, null])) as Pick<AthleteStatTotals, StatField>
  return { games: 0, measuredGames, ...totals }
}

export function aggregateAthleteStats(players: PlayerMatchStats[]): AthleteStatTotals {
  const measuredGames = Object.fromEntries(
    STAT_FIELDS.map((field) => [field, players.filter((player) => player[field] !== null).length]),
  ) as Record<StatField, number>
  const totals = Object.fromEntries(
    STAT_FIELDS.map((field) => [field, sumNullable(players.map((player) => player[field]))]),
  ) as Pick<AthleteStatTotals, StatField>
  return { games: players.length, measuredGames, ...totals }
}

export function perGame(value: number | null, measuredGames: number): number | null {
  return value === null || measuredGames === 0 ? null : value / measuredGames
}

export interface TeamStatTotals {
  minutesSeconds: number | null; pts: number | null; reb: number | null; ast: number | null; stl: number | null; blk: number | null
  tov: number | null; pf: number | null; fgm: number | null; fga: number | null; threeFgm: number | null; threeFga: number | null
  ftm: number | null; fta: number | null
}

export function aggregateTeamStats(players: PlayerMatchStats[]): TeamStatTotals {
  return Object.fromEntries(
    STAT_FIELDS.map((field) => [field, sumNullable(players.map((player) => player[field]))]),
  ) as Record<StatField, number | null>
}

export function slotDisplayName(slot: Pick<BracketSlot, 'label' | 'position'>, round: Pick<BracketRound, 'label'>): string {
  if (slot.label) return slot.label
  return round.label ? `${round.label} ${slot.position}` : `Vaga ${slot.position}`
}

export function roundDisplayName(round: Pick<BracketRound, 'label' | 'number'>): string {
  return round.label ?? `Rodada ${round.number}`
}
