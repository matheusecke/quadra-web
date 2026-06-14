/**
 * Sports domain — pure helpers, labels and statistic calculations.
 *
 * ⚠️ No data here, only functions. Safe to keep as-is when the real API lands.
 */

import type {
  Championship,
  ChampionshipPhase,
  ChampionshipStatus,
  LeaderStat,
  Match,
  MatchStatus,
  StandingRow,
  StatsStatus,
  Team,
} from './types'

// ── Standings calculations ──────────────────────────────────────────────────

/** Point differential (saldo de pontos). */
export function pointDiff(row: StandingRow): number {
  return row.pointsFor - row.pointsAgainst
}

/** Win percentage (aproveitamento) as 0–1; guards against 0 games. */
export function winPct(row: StandingRow): number {
  return row.played === 0 ? 0 : row.wins / row.played
}

/** Format a win percentage as a `.XXX` string, basketball convention. */
export function formatPct(row: StandingRow): string {
  if (row.played === 0) return '—'
  return winPct(row).toFixed(3).replace(/^0/, '')
}

/** Format a signed point differential, e.g. `+42`, `-8`, `0`. */
export function formatDiff(row: StandingRow): string {
  const d = pointDiff(row)
  return d > 0 ? `+${d}` : `${d}`
}

/**
 * Sort standings by championship tie-break order:
 * wins → point differential → points for.
 * Returns a new array with `position` reassigned.
 */
export function rankStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.wins - a.wins ||
        pointDiff(b) - pointDiff(a) ||
        b.pointsFor - a.pointsFor,
    )
    .map((row, i) => ({ ...row, position: i + 1 }))
}

/** Consolidated standings across all groups, re-ranked into a single table. */
export function consolidatedStandings(championship: Championship): StandingRow[] {
  const all = championship.groups.flatMap((g) => g.standings)
  return rankStandings(all)
}

// ── Match helpers ─────────────────────────────────────────────────────────────

/** Most recent first. */
export function sortMatchesByDateDesc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

export function isFinished(match: Match): boolean {
  return match.status === 'FINISHED'
}

// ── Team lookups ──────────────────────────────────────────────────────────────

export function teamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((t) => [t.id, t]))
}

// ── Labels (Portuguese) ────────────────────────────────────────────────────────

export const CHAMPIONSHIP_STATUS_LABELS: Record<ChampionshipStatus, string> = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em andamento',
  PLAYOFFS: 'Playoffs',
  FINISHED: 'Encerrado',
  CANCELED: 'Cancelado',
}

export const PHASE_LABELS: Record<ChampionshipPhase, string> = {
  GROUPS: 'Fase de grupos',
  ROUNDS_OF_16: 'Oitavas de final',
  QUARTERS: 'Quartas de final',
  SEMIS: 'Semifinais',
  FINAL: 'Final',
  FINISHED: 'Encerrado',
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'Agendada',
  LIVE: 'Ao vivo',
  FINISHED: 'Finalizada',
  POSTPONED: 'Adiada',
}

export const STATS_STATUS_LABELS: Record<StatsStatus, string> = {
  COMPLETE: 'Estatísticas completas',
  PARTIAL: 'Estatísticas incompletas',
  PENDING: 'Sem estatísticas',
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

export function championshipStatusVariant(status: ChampionshipStatus): BadgeVariant {
  switch (status) {
    case 'IN_PROGRESS':
      return 'accent'
    case 'PLAYOFFS':
      return 'warning'
    case 'FINISHED':
      return 'success'
    case 'CANCELED':
      return 'danger'
    case 'SCHEDULED':
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
export function matchProgress(championship: Championship): string {
  return `${championship.finishedMatchCount}/${championship.matchCount}`
}

export function formatPeriod(championship: Championship): string {
  return `${formatDate(championship.startDate)} - ${formatDate(championship.endDate)}`
}
