import { describe, it, expect } from 'vitest'
import { boxScoreReducer, initBoxScoreState } from './boxScore.reducer'

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
})
