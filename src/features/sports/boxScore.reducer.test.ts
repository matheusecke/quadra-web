import { describe, it, expect } from 'vitest'
import { boxScoreReducer, columnHasData, initBoxScoreState, teamTotalPoints } from './boxScore.reducer'
import { STAT_FIELDS } from './statistics'
import type { MatchPeriod } from './types'
import type { PlayerStatInput } from './statistics'

const init = () => initBoxScoreState({ tournamentRosterIds: [1, 2], regularPeriods: 4 })

const savedPeriod = (
  periodNumber: number,
  periodType: MatchPeriod['periodType'],
  homePoints: number,
  awayPoints: number,
): MatchPeriod => ({
  periodNumber,
  periodType,
  homePoints,
  awayPoints,
  startedAt: null,
  endedAt: null,
})

const nullLine = (): PlayerStatInput => ({
  pts: null,
  fgm: null,
  fga: null,
  threeFgm: null,
  threeFga: null,
  ftm: null,
  fta: null,
  reb: null,
  ast: null,
  stl: null,
  blk: null,
  tov: null,
  pf: null,
  minutesSeconds: null,
})

describe('boxScoreReducer', () => {
  it('adds an overtime period after the regular ones', () => {
    const next = boxScoreReducer(init(), { type: 'addOvertime' })
    expect(next.periods).toHaveLength(5)
    expect(next.periods[4]).toMatchObject({ type: 'OVERTIME', overtimeNumber: 1 })
  })
  it('removes the last overtime but never a regular period', () => {
    let s = boxScoreReducer(init(), { type: 'addOvertime' })
    s = boxScoreReducer(s, { type: 'removeOvertime' })
    expect(s.periods).toHaveLength(4)
    s = boxScoreReducer(s, { type: 'removeOvertime' })
    expect(s.periods).toHaveLength(4)
  })
  it('updates a single stat field for one roster entry', () => {
    const s = boxScoreReducer(init(), { type: 'setStat', tournamentRosterId: 1, field: 'pts', value: 22 })
    expect(s.lines[1].pts).toBe(22)
  })

  it('starts from the MVP already recorded on the match', () => {
    const state = initBoxScoreState({ tournamentRosterIds: [1, 2], regularPeriods: 4, mvpTournamentRosterId: 2 })

    expect(state.mvpTournamentRosterId).toBe(2)
  })

  it('starts with every column enabled', () => {
    expect(init().disabledColumns).toEqual([])
  })

  it('disabling a group nulls its fields on every line and records the columns', () => {
    const next = boxScoreReducer(init(), { type: 'setColumnEnabled', fields: ['reb'], enabled: false })

    expect(next.lines[1].reb).toBeNull()
    expect(next.lines[2].reb).toBeNull()
    expect(next.disabledColumns).toContain('reb')
  })

  it('re-enabling initialises only null cells with 0', () => {
    let state = boxScoreReducer(init(), { type: 'setColumnEnabled', fields: ['reb'], enabled: false })
    state = boxScoreReducer(
      { ...state, lines: { ...state.lines, 1: { ...state.lines[1], reb: 7 } } },
      { type: 'setColumnEnabled', fields: ['reb'], enabled: true },
    )

    expect(state.lines[1].reb).toBe(7)
    expect(state.lines[2].reb).toBe(0)
    expect(state.disabledColumns).not.toContain('reb')
  })

  it('derives disabled columns from all-null data on load', () => {
    const nulls = Object.fromEntries(STAT_FIELDS.map((field) => [field, null]))
    const state = initBoxScoreState({
      tournamentRosterIds: [1],
      regularPeriods: 4,
      initialLines: { 1: { ...nulls, reb: 3 } as never },
    })

    expect(state.disabledColumns).not.toContain('reb')
    expect(state.disabledColumns).toContain('pts')
  })

  it('returns a null team total when points are not tracked', () => {
    const state = boxScoreReducer(init(), { type: 'setColumnEnabled', fields: ['pts'], enabled: false })

    expect(teamTotalPoints(state, [1, 2])).toBeNull()
  })

  it('reports whether a group has any measured value', () => {
    const state = init()
    expect(columnHasData(state, ['pts'])).toBe(true)

    const disabled = boxScoreReducer(state, { type: 'setColumnEnabled', fields: ['pts'], enabled: false })
    expect(columnHasData(disabled, ['pts'])).toBe(false)
  })

  it('starts four regular periods at zero when the match has no saved periods', () => {
    expect(init().periods).toEqual([
      { periodNumber: 1, type: 'REGULAR', overtimeNumber: null, homePoints: 0, awayPoints: 0 },
      { periodNumber: 2, type: 'REGULAR', overtimeNumber: null, homePoints: 0, awayPoints: 0 },
      { periodNumber: 3, type: 'REGULAR', overtimeNumber: null, homePoints: 0, awayPoints: 0 },
      { periodNumber: 4, type: 'REGULAR', overtimeNumber: null, homePoints: 0, awayPoints: 0 },
    ])
  })

  it('preserves saved regular periods and fills the missing regular periods with zero', () => {
    const state = initBoxScoreState({
      tournamentRosterIds: [1, 2],
      initialPeriods: [savedPeriod(1, 'REGULAR', 18, 22)],
    })

    expect(state.periods).toEqual([
      { periodNumber: 1, type: 'REGULAR', overtimeNumber: null, homePoints: 18, awayPoints: 22 },
      { periodNumber: 2, type: 'REGULAR', overtimeNumber: null, homePoints: 0, awayPoints: 0 },
      { periodNumber: 3, type: 'REGULAR', overtimeNumber: null, homePoints: 0, awayPoints: 0 },
      { periodNumber: 4, type: 'REGULAR', overtimeNumber: null, homePoints: 0, awayPoints: 0 },
    ])
  })

  it('preserves saved overtime periods after the four regular periods', () => {
    const state = initBoxScoreState({
      tournamentRosterIds: [1, 2],
      initialPeriods: [
        savedPeriod(1, 'REGULAR', 10, 10),
        savedPeriod(2, 'REGULAR', 10, 10),
        savedPeriod(3, 'REGULAR', 10, 10),
        savedPeriod(4, 'REGULAR', 10, 10),
        savedPeriod(5, 'OVERTIME', 7, 5),
      ],
    })

    expect(state.periods[4]).toEqual({
      periodNumber: 5,
      type: 'OVERTIME',
      overtimeNumber: 1,
      homePoints: 7,
      awayPoints: 5,
    })
  })

  it('starts a newly added overtime period at zero', () => {
    const next = boxScoreReducer(init(), { type: 'addOvertime' })

    expect(next.periods[4]).toMatchObject({ homePoints: 0, awayPoints: 0 })
  })

  it('uses each persisted metric modality for athletes missing from saved stats', () => {
    const persisted = { ...nullLine(), reb: 3 }
    const state = initBoxScoreState({
      tournamentRosterIds: [1, 2],
      initialLines: { 1: persisted },
    })

    expect(state.lines[1]).toEqual(persisted)
    expect(state.lines[2].pts).toBeNull()
    expect(state.lines[2].reb).toBe(0)
    expect(state.disabledColumns).toContain('pts')
    expect(state.disabledColumns).not.toContain('reb')
  })
})
