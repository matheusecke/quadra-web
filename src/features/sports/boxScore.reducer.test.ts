import { describe, it, expect } from 'vitest'
import { boxScoreReducer, columnHasData, initBoxScoreState, teamTotalPoints } from './boxScore.reducer'
import { STAT_FIELDS } from './statistics'

const init = () => initBoxScoreState({ tournamentRosterIds: ['roster-1', 'roster-2'], regularPeriods: 4 })

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
    const s = boxScoreReducer(init(), { type: 'setStat', tournamentRosterId: 'roster-1', field: 'pts', value: 22 })
    expect(s.lines['roster-1'].pts).toBe(22)
  })

  it('starts from the MVP already recorded on the match', () => {
    const state = initBoxScoreState({ tournamentRosterIds: ['r1', 'r2'], regularPeriods: 4, mvpTournamentRosterId: 'r2' })

    expect(state.mvpTournamentRosterId).toBe('r2')
  })

  it('starts with every column enabled', () => {
    expect(init().disabledColumns).toEqual([])
  })

  it('disabling a group nulls its fields on every line and records the columns', () => {
    const next = boxScoreReducer(init(), { type: 'setColumnEnabled', fields: ['reb'], enabled: false })

    expect(next.lines['roster-1'].reb).toBeNull()
    expect(next.lines['roster-2'].reb).toBeNull()
    expect(next.disabledColumns).toContain('reb')
  })

  it('re-enabling initialises only null cells with 0', () => {
    let state = boxScoreReducer(init(), { type: 'setColumnEnabled', fields: ['reb'], enabled: false })
    state = boxScoreReducer(
      { ...state, lines: { ...state.lines, 'roster-1': { ...state.lines['roster-1'], reb: 7 } } },
      { type: 'setColumnEnabled', fields: ['reb'], enabled: true },
    )

    expect(state.lines['roster-1'].reb).toBe(7)
    expect(state.lines['roster-2'].reb).toBe(0)
    expect(state.disabledColumns).not.toContain('reb')
  })

  it('derives disabled columns from all-null data on load', () => {
    const nulls = Object.fromEntries(STAT_FIELDS.map((field) => [field, null]))
    const state = initBoxScoreState({
      tournamentRosterIds: ['roster-1'],
      regularPeriods: 4,
      initialLines: { 'roster-1': { ...nulls, reb: 3 } as never },
    })

    expect(state.disabledColumns).not.toContain('reb')
    expect(state.disabledColumns).toContain('pts')
  })

  it('returns a null team total when points are not tracked', () => {
    const state = boxScoreReducer(init(), { type: 'setColumnEnabled', fields: ['pts'], enabled: false })

    expect(teamTotalPoints(state, ['roster-1', 'roster-2'])).toBeNull()
  })

  it('reports whether a group has any measured value', () => {
    const state = init()
    expect(columnHasData(state, ['pts'])).toBe(true)

    const disabled = boxScoreReducer(state, { type: 'setColumnEnabled', fields: ['pts'], enabled: false })
    expect(columnHasData(disabled, ['pts'])).toBe(false)
  })
})
