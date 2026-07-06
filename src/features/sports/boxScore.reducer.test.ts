import { describe, it, expect } from 'vitest'
import { boxScoreReducer, initBoxScoreState } from './boxScore.reducer'

const init = () => initBoxScoreState({ athleteIds: ['a1', 'a2'], regularPeriods: 4 })

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
  it('updates a single stat field for one athlete', () => {
    const s = boxScoreReducer(init(), { type: 'setStat', athleteId: 'a1', field: 'pts', value: 22 })
    expect(s.lines.a1.pts).toBe(22)
  })
})
