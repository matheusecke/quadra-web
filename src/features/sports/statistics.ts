import type { AthleteStatTotals, PeriodScore, PlayerMatchStats } from './types'

export interface PlayerStatInput {
  pts: number; fgm: number; fga: number; threeFgm: number; threeFga: number
  ftm: number; fta: number; reb: number; ast: number; stl: number
  blk: number; tov: number; pf: number; minutesSeconds: number
}

export interface StatValidationError { field: keyof PlayerStatInput; message: string }
export interface PerGameAverages { pts: number; reb: number; ast: number; stl: number; blk: number }

const round3 = (n: number) => Math.round(n * 1000) / 1000

export function sumPlayerStats(lines: PlayerMatchStats[]): AthleteStatTotals {
  const base: AthleteStatTotals = {
    games: lines.length, minutesSeconds: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
    tov: 0, pf: 0, fgm: 0, fga: 0, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0,
  }
  return lines.reduce((acc, l) => ({
    games: acc.games, minutesSeconds: acc.minutesSeconds + l.minutesSeconds, pts: acc.pts + l.pts, reb: acc.reb + l.reb,
    ast: acc.ast + l.ast, stl: acc.stl + l.stl, blk: acc.blk + l.blk, tov: acc.tov + l.tov,
    pf: acc.pf + l.pf, fgm: acc.fgm + l.fgm, fga: acc.fga + l.fga, threeFgm: acc.threeFgm + l.threeFgm,
    threeFga: acc.threeFga + l.threeFga, ftm: acc.ftm + l.ftm, fta: acc.fta + l.fta,
  }), base)
}

export function averagePlayerStats(totals: AthleteStatTotals): PerGameAverages {
  const g = totals.games || 0
  const per = (v: number) => (g === 0 ? 0 : round3(v / g))
  return { pts: per(totals.pts), reb: per(totals.reb), ast: per(totals.ast), stl: per(totals.stl), blk: per(totals.blk) }
}

export function shootingPercentages(t: { fgm: number; fga: number; threeFgm: number; threeFga: number; ftm: number; fta: number }) {
  const pct = (made: number, att: number) => (att === 0 ? 0 : round3(made / att))
  return { fg: pct(t.fgm, t.fga), tp: pct(t.threeFgm, t.threeFga), ft: pct(t.ftm, t.fta) }
}

export function validatePlayerStatLine(line: PlayerStatInput): StatValidationError[] {
  const errors: StatValidationError[] = []
  const nonNeg: (keyof PlayerStatInput)[] = ['pts', 'fgm', 'fga', 'threeFgm', 'threeFga', 'ftm', 'fta', 'reb', 'ast', 'stl', 'blk', 'tov', 'pf', 'minutesSeconds']
  for (const field of nonNeg) {
    if (line[field] < 0) errors.push({ field, message: 'Não pode ser negativo' })
  }
  if (line.fgm > line.fga) errors.push({ field: 'fgm', message: 'FGM não pode exceder FGA' })
  if (line.threeFga > line.fga) errors.push({ field: 'threeFga', message: '3PA não pode exceder FGA' })
  if (line.threeFgm > line.threeFga) errors.push({ field: 'threeFgm', message: '3PM não pode exceder 3PA' })
  if (line.threeFgm > line.fgm) errors.push({ field: 'threeFgm', message: '3PM não pode exceder FGM' })
  if (line.ftm > line.fta) errors.push({ field: 'ftm', message: 'FTM não pode exceder FTA' })
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
