import { describe, it, expect } from 'vitest'
import {
  avgNullable,
  sumPlayerStats,
  sumNullable,
  SHOOTING_FIELDS,
  shootingPercentages,
  STAT_TOGGLE_GROUPS,
  validatePlayerStatLine,
  periodsSum,
  isScoreConsistent,
} from './statistics'
import type { PlayerMatchStats, PeriodScore } from './types'
import type { PlayerStatInput } from './statistics'

const line = (over: Partial<PlayerMatchStats>): PlayerMatchStats => ({
  tournamentRosterId: 1, tournamentTeamId: 1, displayName: 'A', minutesSeconds: 600, pts: 10, reb: 5, ast: 2,
  stl: 1, blk: 0, tov: 1, pf: 2, fgm: 4, fga: 9, threeFgm: 1, threeFga: 3, ftm: 1, fta: 2, ...over,
})

const validStatInput: PlayerStatInput = {
  pts: 5,
  fgm: 2,
  fga: 4,
  threeFgm: 1,
  threeFga: 2,
  ftm: 1,
  fta: 2,
  reb: 3,
  ast: 1,
  stl: 0,
  blk: 0,
  tov: 1,
  pf: 2,
  minutesSeconds: 600,
}

describe('sumPlayerStats', () => {
  it('sums points across lines and counts games', () => {
    const totals = sumPlayerStats([
      line({ minutesSeconds: 600, pts: 10 }),
      line({ minutesSeconds: 900, pts: 22 }),
    ])
    expect(totals.pts).toBe(32)
    expect(totals.games).toBe(2)
    expect(totals.minutesSeconds).toBe(1500)
  })
})

describe('shootingPercentages', () => {
  it('computes fg percentage as made over attempted', () => {
    expect(shootingPercentages({ fgm: 4, fga: 8, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0 }).fg).toBe(0.5)
  })
  it('returns null when no attempts', () => {
    expect(shootingPercentages({ fgm: 0, fga: 0, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0 }).fg).toBeNull()
  })
})

describe('validatePlayerStatLine', () => {
  it.each([
    ['fgm', { fgm: 5, fga: 4 }, 'FGM não pode exceder FGA'],
    ['threeFga', { threeFga: 5, fga: 4 }, '3PA não pode exceder FGA'],
    ['threeFgm', { threeFgm: 3, threeFga: 2, fgm: 3 }, '3PM não pode exceder 3PA'],
    ['threeFgm', { threeFgm: 3, threeFga: 3, fgm: 2 }, '3PM não pode exceder FGM'],
    ['ftm', { ftm: 3, fta: 2 }, 'FTM não pode exceder FTA'],
  ] as const)('flags the %s relation', (field, override, message) => {
    expect(validatePlayerStatLine({ ...validStatInput, ...override })).toContainEqual({
      field,
      message,
    })
  })

  it('rejects a non-integer metric', () => {
    expect(validatePlayerStatLine({ ...validStatInput, pts: 1.5 })).toContainEqual({
      field: 'pts',
      message: 'Deve ser um número inteiro',
    })
  })

  it('rejects a negative metric', () => {
    expect(validatePlayerStatLine({ ...validStatInput, reb: -1 })).toContainEqual({
      field: 'reb',
      message: 'Não pode ser negativo',
    })
  })

  it('returns no errors for a consistent line', () => {
    expect(validatePlayerStatLine(validStatInput)).toEqual([])
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

  it('is false when player points do not equal the period score', () => {
    expect(isScoreConsistent(67, 68)).toBe(false)
  })
})

describe('sumNullable', () => {
  it('returns null when every value is null', () => {
    expect(sumNullable([null, null])).toBeNull()
  })

  it('sums only the measured values', () => {
    expect(sumNullable([2, null, 3])).toBe(5)
  })
})

describe('avgNullable', () => {
  it('divides by measured games only', () => {
    expect(avgNullable(10, 4)).toBe(2.5)
  })

  it('is null when nothing was measured', () => {
    expect(avgNullable(null, 0)).toBeNull()
    expect(avgNullable(10, 0)).toBeNull()
  })
})

describe('STAT_TOGGLE_GROUPS', () => {
  it('groups the six shooting counters into one toggle', () => {
    const shooting = STAT_TOGGLE_GROUPS.find((group) => group.id === 'shooting')
    expect(shooting?.fields).toEqual(SHOOTING_FIELDS)
    expect(SHOOTING_FIELDS).toEqual(['fgm', 'fga', 'threeFgm', 'threeFga', 'ftm', 'fta'])
  })
})

const base = {
  pts: 0, fgm: 0, fga: 0, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0,
  reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, minutesSeconds: 0,
}

describe('validatePlayerStatLine with null', () => {
  it('ignores null metrics', () => {
    expect(validatePlayerStatLine({ ...base, reb: null })).toEqual([])
  })

  it('only compares fgm/fga when both present', () => {
    expect(validatePlayerStatLine({ ...base, fgm: 5, fga: null })).toEqual([])
  })
})
