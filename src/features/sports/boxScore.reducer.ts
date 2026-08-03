import type { MatchPeriod, PeriodScore } from './types'
import type { PlayerStatInput, StatField, StatValidationError } from './statistics'
import { STAT_FIELDS, sumNullable, validatePlayerStatLine } from './statistics'

export interface BoxScoreState {
  periods: PeriodScore[]
  lines: Record<number, PlayerStatInput>
  disabledColumns: StatField[]
  mvpTournamentRosterId: number | null
}

export type BoxScoreAction =
  | { type: 'setPeriod'; index: number; side: 'home' | 'away'; value: number }
  | { type: 'addOvertime' }
  | { type: 'removeOvertime' }
  | { type: 'setStat'; tournamentRosterId: number; field: keyof PlayerStatInput; value: number | null }
  | { type: 'setColumnEnabled'; fields: StatField[]; enabled: boolean }
  | { type: 'setMvp'; tournamentRosterId: number | null }

const zeroLine = (): PlayerStatInput => ({
  pts: 0, fgm: 0, fga: 0, threeFgm: 0, threeFga: 0, ftm: 0, fta: 0,
  reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, minutesSeconds: 0,
})

export function initBoxScoreState({
  tournamentRosterIds,
  regularPeriods = 4,
  initialPeriods = [],
  mvpTournamentRosterId = null,
  initialLines,
}: {
  tournamentRosterIds: number[]
  regularPeriods?: number
  initialPeriods?: MatchPeriod[]
  mvpTournamentRosterId?: number | null
  initialLines?: Record<number, PlayerStatInput>
}): BoxScoreState {
  const savedRegularPeriods = new Map(
    initialPeriods
      .filter((period) => period.periodType === 'REGULAR')
      .map((period) => [period.periodNumber, period]),
  )
  const periods: PeriodScore[] = Array.from({ length: regularPeriods }, (_, index) => {
    const periodNumber = index + 1
    const saved = savedRegularPeriods.get(periodNumber)
    return {
      periodNumber,
      type: 'REGULAR',
      overtimeNumber: null,
      homePoints: saved?.homePoints ?? 0,
      awayPoints: saved?.awayPoints ?? 0,
    }
  })
  periods.push(
    ...initialPeriods
      .filter((period) => period.periodType === 'OVERTIME')
      .map((period) => ({
        periodNumber: period.periodNumber,
        type: 'OVERTIME' as const,
        overtimeNumber: period.periodNumber - regularPeriods,
        homePoints: period.homePoints,
        awayPoints: period.awayPoints,
      })),
  )

  const savedLines = Object.values(initialLines ?? {})
  const defaultLine = Object.fromEntries(
    STAT_FIELDS.map((field) => [
      field,
      savedLines.length > 0 && savedLines.every((line) => line[field] === null)
        ? null
        : 0,
    ]),
  ) as unknown as PlayerStatInput
  const lines: Record<number, PlayerStatInput> = {}
  for (const id of tournamentRosterIds) {
    lines[id] = { ...defaultLine, ...initialLines?.[id] }
  }
  const disabledColumns = tournamentRosterIds.length === 0
    ? []
    : STAT_FIELDS.filter((field) =>
      tournamentRosterIds.every((id) => lines[id][field] === null),
    )
  return { periods, lines, disabledColumns, mvpTournamentRosterId }
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
        homePoints: 0,
        awayPoints: 0,
      }
      return { ...state, periods: [...state.periods, period] }
    }
    case 'removeOvertime': {
      const last = state.periods[state.periods.length - 1]
      if (!last || last.type !== 'OVERTIME') return state
      return { ...state, periods: state.periods.slice(0, -1) }
    }
    case 'setStat': {
      const current = state.lines[action.tournamentRosterId] ?? zeroLine()
      return {
        ...state,
        lines: { ...state.lines, [action.tournamentRosterId]: { ...current, [action.field]: action.value } },
      }
    }
    case 'setColumnEnabled': {
      const lines: Record<number, PlayerStatInput> = {}
      for (const [id, line] of Object.entries(state.lines)) {
        const next = { ...line }
        for (const field of action.fields) {
          if (!action.enabled) next[field] = null
          else if (next[field] === null) next[field] = 0
        }
        lines[Number(id)] = next
      }
      const disabledColumns = new Set(state.disabledColumns)
      for (const field of action.fields) {
        if (action.enabled) disabledColumns.delete(field)
        else disabledColumns.add(field)
      }
      return { ...state, lines, disabledColumns: [...disabledColumns] }
    }
    case 'setMvp':
      return { ...state, mvpTournamentRosterId: action.tournamentRosterId }
    default:
      return state
  }
}

export function teamTotalPoints(state: BoxScoreState, tournamentRosterIds: number[]): number | null {
  const points = tournamentRosterIds.map((id) => state.lines[id]?.pts ?? null)
  return points.some((value) => value === null) ? null : sumNullable(points)
}

export function columnHasData(state: BoxScoreState, fields: StatField[]): boolean {
  return Object.values(state.lines).some((line) => fields.some((field) => line[field] !== null))
}

export function lineErrors(state: BoxScoreState, tournamentRosterId: number): StatValidationError[] {
  const line = state.lines[tournamentRosterId]
  return line ? validatePlayerStatLine(line) : []
}
