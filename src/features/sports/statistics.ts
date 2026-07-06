import type { AthleteStatTotals, PeriodScore, PlayerMatchStats } from './types'

export interface PlayerStatInput {
  pts: number; fgm: number; fga: number; tpm: number; tpa: number
  ftm: number; fta: number; reb: number; ast: number; stl: number
  blk: number; to: number; pf: number; min: number
}

export interface StatValidationError { field: keyof PlayerStatInput; message: string }
export interface PerGameAverages { pts: number; reb: number; ast: number; stl: number; blk: number }

const round3 = (n: number) => Math.round(n * 1000) / 1000

export function sumPlayerStats(lines: PlayerMatchStats[]): AthleteStatTotals {
  const base: AthleteStatTotals = {
    games: lines.length, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
    to: 0, pf: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
  }
  return lines.reduce((acc, l) => ({
    games: acc.games, min: acc.min + l.min, pts: acc.pts + l.pts, reb: acc.reb + l.reb,
    ast: acc.ast + l.ast, stl: acc.stl + l.stl, blk: acc.blk + l.blk, to: acc.to + l.to,
    pf: acc.pf + l.pf, fgm: acc.fgm + l.fgm, fga: acc.fga + l.fga, tpm: acc.tpm + l.tpm,
    tpa: acc.tpa + l.tpa, ftm: acc.ftm + l.ftm, fta: acc.fta + l.fta,
  }), base)
}

export function averagePlayerStats(totals: AthleteStatTotals): PerGameAverages {
  const g = totals.games || 0
  const per = (v: number) => (g === 0 ? 0 : round3(v / g))
  return { pts: per(totals.pts), reb: per(totals.reb), ast: per(totals.ast), stl: per(totals.stl), blk: per(totals.blk) }
}

export function shootingPercentages(t: { fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number }) {
  const pct = (made: number, att: number) => (att === 0 ? 0 : round3(made / att))
  return { fg: pct(t.fgm, t.fga), tp: pct(t.tpm, t.tpa), ft: pct(t.ftm, t.fta) }
}

export function validatePlayerStatLine(line: PlayerStatInput): StatValidationError[] {
  const errors: StatValidationError[] = []
  const nonNeg: (keyof PlayerStatInput)[] = ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'reb', 'ast', 'stl', 'blk', 'to', 'pf', 'min']
  for (const field of nonNeg) {
    if (line[field] < 0) errors.push({ field, message: 'Não pode ser negativo' })
  }
  if (line.fgm > line.fga) errors.push({ field: 'fgm', message: 'FGM não pode exceder FGA' })
  if (line.tpm > line.tpa) errors.push({ field: 'tpm', message: '3PM não pode exceder 3PA' })
  if (line.ftm > line.fta) errors.push({ field: 'ftm', message: 'FTM não pode exceder FTA' })
  return errors
}

export function periodsSum(periods: PeriodScore[]): { home: number; away: number } {
  return periods.reduce(
    (acc, p) => ({ home: acc.home + (p.homePoints ?? 0), away: acc.away + (p.awayPoints ?? 0) }),
    { home: 0, away: 0 },
  )
}

export function isScoreConsistent(teamPointsTotal: number, finalScore: number): boolean {
  return teamPointsTotal === finalScore
}
