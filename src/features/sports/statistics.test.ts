import { describe, it, expect } from 'vitest'
import {
  sumPlayerStats,
  shootingPercentages,
  validatePlayerStatLine,
  periodsSum,
  isScoreConsistent,
} from './statistics'
import type { PlayerMatchStats, PeriodScore } from './types'

const line = (over: Partial<PlayerMatchStats>): PlayerMatchStats => ({
  tournamentRosterId: 'roster-a', athleteId: 'a', athleteName: 'A', number: 1, min: 600, pts: 10, reb: 5, ast: 2,
  stl: 1, blk: 0, plusMinus: 0, to: 1, pf: 2, fgm: 4, fga: 9, tpm: 1, tpa: 3, ftm: 1, fta: 2, ...over,
})

describe('sumPlayerStats', () => {
  it('sums points across lines and counts games', () => {
    const totals = sumPlayerStats([line({ pts: 10 }), line({ pts: 22 })])
    expect(totals.pts).toBe(32)
    expect(totals.games).toBe(2)
  })
})

describe('shootingPercentages', () => {
  it('computes fg percentage as made over attempted', () => {
    expect(shootingPercentages({ fgm: 4, fga: 8, tpm: 0, tpa: 0, ftm: 0, fta: 0 }).fg).toBe(0.5)
  })
  it('returns zero when no attempts', () => {
    expect(shootingPercentages({ fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 }).fg).toBe(0)
  })
})

describe('validatePlayerStatLine', () => {
  it('flags made greater than attempted', () => {
    const errors = validatePlayerStatLine({ pts: 5, fgm: 9, fga: 4, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, min: 0 })
    expect(errors.map((e) => e.field)).toContain('fgm')
  })
  it('returns no errors for a consistent line', () => {
    expect(validatePlayerStatLine({ pts: 5, fgm: 2, fga: 4, tpm: 1, tpa: 2, ftm: 0, fta: 0, reb: 3, ast: 1, stl: 0, blk: 0, to: 1, pf: 2, min: 600 })).toEqual([])
  })
})

describe('periodsSum', () => {
  it('sums home and away points across periods including overtime', () => {
    const periods: PeriodScore[] = [
      { periodNumber: 1, type: 'REGULAR', overtimeNumber: null, homePoints: 18, awayPoints: 16 },
      { periodNumber: 5, type: 'OVERTIME', overtimeNumber: 1, homePoints: 7, awayPoints: 4 },
    ]
    expect(periodsSum(periods)).toEqual({ home: 25, away: 20 })
  })
})

describe('isScoreConsistent', () => {
  it('is true when player points total equals the final score', () => {
    expect(isScoreConsistent(68, 68)).toBe(true)
  })
})
