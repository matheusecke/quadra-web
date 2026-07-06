import type { PeriodScore } from './types'
import type { PlayerStatInput, StatValidationError } from './statistics'
import { validatePlayerStatLine } from './statistics'

export interface BoxScoreState {
  periods: PeriodScore[]
  lines: Record<string, PlayerStatInput>
  mvpAthleteId: string | null
}

export type BoxScoreAction =
  | { type: 'setPeriod'; index: number; side: 'home' | 'away'; value: number }
  | { type: 'addOvertime' }
  | { type: 'removeOvertime' }
  | { type: 'setStat'; athleteId: string; field: keyof PlayerStatInput; value: number }
  | { type: 'setMvp'; athleteId: string | null }

const zeroLine = (): PlayerStatInput => ({
  pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
  reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, min: 0,
})

export function initBoxScoreState({ athleteIds, regularPeriods }: { athleteIds: string[]; regularPeriods: number }): BoxScoreState {
  const periods: PeriodScore[] = Array.from({ length: regularPeriods }, (_, i) => ({
    periodNumber: i + 1,
    type: 'REGULAR',
    overtimeNumber: null,
    homePoints: null,
    awayPoints: null,
  }))
  const lines: Record<string, PlayerStatInput> = {}
  for (const id of athleteIds) lines[id] = zeroLine()
  return { periods, lines, mvpAthleteId: null }
}

export function boxScoreReducer(state: BoxScoreState, action: BoxScoreAction): BoxScoreState {
  switch (action.type) {
    case 'setPeriod': {
      const periods = state.periods.map((period, i) =>
        i === action.index
          ? { ...period, [action.side === 'home' ? 'homePoints' : 'awayPoints']: action.value }
          : period,
      )
      return { ...state, periods }
    }
    case 'addOvertime': {
      const overtimeCount = state.periods.filter((p) => p.type === 'OVERTIME').length
      const period: PeriodScore = {
        periodNumber: state.periods.length + 1,
        type: 'OVERTIME',
        overtimeNumber: overtimeCount + 1,
        homePoints: null,
        awayPoints: null,
      }
      return { ...state, periods: [...state.periods, period] }
    }
    case 'removeOvertime': {
      const last = state.periods[state.periods.length - 1]
      if (!last || last.type !== 'OVERTIME') return state
      return { ...state, periods: state.periods.slice(0, -1) }
    }
    case 'setStat': {
      const current = state.lines[action.athleteId] ?? zeroLine()
      return {
        ...state,
        lines: { ...state.lines, [action.athleteId]: { ...current, [action.field]: Number(action.value) } },
      }
    }
    case 'setMvp':
      return { ...state, mvpAthleteId: action.athleteId }
    default:
      return state
  }
}

export function teamTotalPoints(state: BoxScoreState, athleteIds: string[]): number {
  return athleteIds.reduce((sum, id) => sum + (state.lines[id]?.pts ?? 0), 0)
}

export function lineErrors(state: BoxScoreState, athleteId: string): StatValidationError[] {
  const line = state.lines[athleteId]
  return line ? validatePlayerStatLine(line) : []
}
