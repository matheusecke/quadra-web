/**
 * Sports domain — pure helpers, labels and statistic calculations.
 *
 * ⚠️ No data here, only functions. Safe to keep as-is when the real API lands.
 */

import type {
  AthleteStatus,
  BracketRound,
  BracketSlot,
  Tournament,
  TournamentFormat,
  TournamentStatus,
  MatchPeriod,
  MatchStatus,
  MatchSummary,
  StandingRow,
  Team,
  TeamProfileStatus,
  TournamentTeam,
  TournamentTeamStatus,
} from './types'

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

export function hasGroupStage(format: TournamentFormat): boolean {
  return format === 'GROUP_STAGE' || format === 'GROUP_STAGE_KNOCKOUT'
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

export const TEAM_PROFILE_STATUS_LABELS: Record<TeamProfileStatus, string> = {
  ACTIVE: 'Ativa',
  HISTORICAL: 'Histórica',
  INACTIVE: 'Inativa',
}

export const TOURNAMENT_TEAM_STATUS_LABELS: Record<TournamentTeamStatus, string> = {
  ACTIVE: 'Ativa',
  WITHDRAWN: 'Desistente',
}

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

export function teamProfileStatusVariant(status: TeamProfileStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'danger'
    case 'HISTORICAL':
    default:
      return 'ghost'
  }
}

// ── Date formatting (pt-BR) ─────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso))
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
export function getPeriodLabel(period: MatchPeriod): string {
  if (period.periodType === 'REGULAR') return `${period.periodNumber}Q`
  return period.periodNumber === 1 ? 'OT' : `${period.periodNumber}OT`
}

// ── Per-match stat helpers ─────────────────────────────────────────────────────

/** Percentage with 1 decimal. Returns '—' when denominator is 0. */
export function formatStatPct(made: number | null, attempted: number | null): string {
  if (made === null || attempted === null) return 'N/A'
  if (attempted === 0) return '—'
  return ((made / attempted) * 100).toFixed(1)
}

export function formatMinutesSeconds(totalSeconds: number | null): string {
  if (totalSeconds === null) return 'N/A'
  const roundedSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = String(roundedSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

/** Displays a server-owned number without imposing a new precision. */
export function formatServerDecimal(value: number | null): string {
  return value === null ? 'N/A' : String(value)
}

/** Phase 10 percentages are server-owned fractions and may exceed 1.0. */
export function formatServerPercentage(value: number | null): string {
  if (value === null) return 'N/A'
  return `${Number((value * 100).toFixed(1))}%`
}

export function formatServerEfficiency(value: number | null): string {
  if (value === null) return 'N/A'
  const formatted = formatServerDecimal(value)
  return value > 0 ? `+${formatted}` : formatted
}

export function formatMeasuredGames(count: number): string {
  return count === 1 ? 'em 1 jogo medido' : `em ${count} jogos medidos`
}

export function formatShootingLine(made: number | null, attempted: number | null): string {
  return made === null || attempted === null ? 'N/A' : `${made}/${attempted}`
}

// ── Team profile formatting ───────────────────────────────────────────────────
// The team profile renders an unavailable value as `—` (spec §4.8); the athlete
// screens keep their own `N/A` convention.

/** `city / state`, dropping whichever half is missing. */
export function formatTeamLocation(city: string | null, state: string | null): string {
  return [city, state].filter(Boolean).join(' / ') || '—'
}

/** Server-owned average, printed without imposing a new precision. */
export function formatAverage(value: number | null): string {
  return value === null ? '—' : String(value)
}

/** Signed average, used for the official point differential per game. */
export function formatSignedAverage(value: number | null): string {
  if (value === null) return '—'
  return value > 0 ? `+${value}` : String(value)
}

/** Server-owned fraction shown as a percentage; values may exceed 1.0. */
export function formatRate(value: number | null): string {
  if (value === null) return '—'
  return `${Number((value * 100).toFixed(1))}%`
}

export function slotDisplayName(slot: Pick<BracketSlot, 'label' | 'position'>, round: Pick<BracketRound, 'label'>): string {
  if (slot.label) return slot.label
  return round.label ? `${round.label} ${slot.position}` : `Vaga ${slot.position}`
}

export function roundDisplayName(round: Pick<BracketRound, 'label' | 'number'>): string {
  return round.label ?? `Rodada ${round.number}`
}
