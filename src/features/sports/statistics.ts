import type { AthleteStatTotals, PeriodScore, PlayerMatchStats } from './types'

export const STAT_FIELDS = [
  'minutesSeconds', 'pts', 'reb', 'ast', 'stl', 'blk', 'tov', 'pf',
  'fgm', 'fga', 'threeFgm', 'threeFga', 'ftm', 'fta',
] as const
export type StatField = (typeof STAT_FIELDS)[number]

export const SHOOTING_FIELDS: StatField[] = ['fgm', 'fga', 'threeFgm', 'threeFga', 'ftm', 'fta']

export interface StatToggleGroup { id: string; label: string; fields: StatField[] }

export const STAT_TOGGLE_GROUPS: StatToggleGroup[] = [
  { id: 'minutesSeconds', label: 'Minutos (MIN)', fields: ['minutesSeconds'] },
  { id: 'pts', label: 'Pontos (PTS)', fields: ['pts'] },
  { id: 'reb', label: 'Rebotes (REB)', fields: ['reb'] },
  { id: 'ast', label: 'Assistências (AST)', fields: ['ast'] },
  { id: 'stl', label: 'Roubos (STL)', fields: ['stl'] },
  { id: 'blk', label: 'Tocos (BLK)', fields: ['blk'] },
  { id: 'tov', label: 'Turnovers (TOV)', fields: ['tov'] },
  { id: 'pf', label: 'Faltas (PF)', fields: ['pf'] },
  { id: 'shooting', label: 'Arremessos (FG · 3P · FT)', fields: SHOOTING_FIELDS },
]

export function sumNullable(values: Array<number | null>): number | null {
  let total = 0
  let seen = false
  for (const value of values) {
    if (value !== null) {
      total += value
      seen = true
    }
  }
  return seen ? total : null
}

export function avgNullable(total: number | null, measuredGames: number): number | null {
  return total === null || measuredGames === 0 ? null : total / measuredGames
}

export interface PlayerStatInput {
  pts: number | null; fgm: number | null; fga: number | null; threeFgm: number | null; threeFga: number | null
  ftm: number | null; fta: number | null; reb: number | null; ast: number | null; stl: number | null
  blk: number | null; tov: number | null; pf: number | null; minutesSeconds: number | null
}

export interface StatValidationError { field: keyof PlayerStatInput; message: string }
export interface PerGameAverages { pts: number | null; reb: number | null; ast: number | null; stl: number | null; blk: number | null }

const round3 = (n: number) => Math.round(n * 1000) / 1000

export function sumPlayerStats(lines: PlayerMatchStats[]): AthleteStatTotals {
  const measuredGames = Object.fromEntries(
    STAT_FIELDS.map((field) => [field, lines.filter((line) => line[field] !== null).length]),
  ) as Record<StatField, number>
  const totals = Object.fromEntries(
    STAT_FIELDS.map((field) => [field, sumNullable(lines.map((line) => line[field]))]),
  ) as Pick<AthleteStatTotals, StatField>
  return { games: lines.length, measuredGames, ...totals }
}

export function averagePlayerStats(totals: AthleteStatTotals): PerGameAverages {
  const per = (field: 'pts' | 'reb' | 'ast' | 'stl' | 'blk') => {
    const average = avgNullable(totals[field], totals.measuredGames[field])
    return average === null ? null : round3(average)
  }
  return { pts: per('pts'), reb: per('reb'), ast: per('ast'), stl: per('stl'), blk: per('blk') }
}

export function shootingPercentages(t: { fgm: number | null; fga: number | null; threeFgm: number | null; threeFga: number | null; ftm: number | null; fta: number | null }) {
  const pct = (made: number | null, att: number | null): number | null =>
    made === null || att === null || att === 0 ? null : round3(made / att)
  return { fg: pct(t.fgm, t.fga), tp: pct(t.threeFgm, t.threeFga), ft: pct(t.ftm, t.fta) }
}

export function validatePlayerStatLine(line: PlayerStatInput): StatValidationError[] {
  const errors: StatValidationError[] = []
  const nonNeg: (keyof PlayerStatInput)[] = ['pts', 'fgm', 'fga', 'threeFgm', 'threeFga', 'ftm', 'fta', 'reb', 'ast', 'stl', 'blk', 'tov', 'pf', 'minutesSeconds']
  for (const field of nonNeg) {
    const value = line[field]
    if (value !== null && !Number.isInteger(value)) {
      errors.push({ field, message: 'Deve ser um número inteiro' })
    }
    if (value !== null && value < 0) errors.push({ field, message: 'Não pode ser negativo' })
  }
  const pair = (first: keyof PlayerStatInput, second: keyof PlayerStatInput) =>
    line[first] !== null && line[second] !== null && line[first] > line[second]
  if (pair('fgm', 'fga')) errors.push({ field: 'fgm', message: 'FGM não pode exceder FGA' })
  if (pair('threeFga', 'fga')) errors.push({ field: 'threeFga', message: '3PA não pode exceder FGA' })
  if (pair('threeFgm', 'threeFga')) errors.push({ field: 'threeFgm', message: '3PM não pode exceder 3PA' })
  if (pair('threeFgm', 'fgm')) errors.push({ field: 'threeFgm', message: '3PM não pode exceder FGM' })
  if (pair('ftm', 'fta')) errors.push({ field: 'ftm', message: 'FTM não pode exceder FTA' })
  return errors
}

export function periodsSum(periods: PeriodScore[]): { home: number; away: number } {
  return periods.reduce(
    (acc, p) => ({ home: acc.home + (p.homePoints ?? 0), away: acc.away + (p.awayPoints ?? 0) }),
    { home: 0, away: 0 },
  )
}

/**
 * Box-score sanity only: does the sum of the players' points match the team's score?
 * Advisory (DB spec §11: alert, never block). Must not be called when the score was
 * awarded by the rules (scoreSource === 'AWARDED') — a 20 × 0 or a 2 × 0 has nothing
 * to reconcile against a box score.
 *
 * The old "sum of periods == final score" check is gone: the layer derives the score
 * from the periods, so the two can never disagree.
 */
export function isScoreConsistent(teamPointsTotal: number, finalScore: number): boolean {
  return teamPointsTotal === finalScore
}
