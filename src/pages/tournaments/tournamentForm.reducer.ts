import type { TournamentFormat } from '../../features/sports/types'

export interface TournamentFormState {
  name: string
  seasonId: string | null
  categoryId: string | null
  format: TournamentFormat
  startDate: string
  endDate: string
  regulation: string
}

export type TournamentFormAction =
  | { [K in keyof TournamentFormState]: { type: 'setField'; field: K; value: TournamentFormState[K] } }[keyof TournamentFormState]
  | { type: 'load'; state: TournamentFormState }

export interface TournamentFormErrors {
  name?: string
  seasonId?: string
  dateRange?: string
}

export const initialTournamentFormState = (): TournamentFormState => ({
  name: '',
  seasonId: null,
  categoryId: null,
  format: 'LEAGUE',
  startDate: '',
  endDate: '',
  regulation: '',
})

export function tournamentFormReducer(state: TournamentFormState, action: TournamentFormAction): TournamentFormState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value }
    case 'load':
      return action.state
    default:
      return state
  }
}

export function validateTournamentForm(state: TournamentFormState): TournamentFormErrors {
  const errors: TournamentFormErrors = {}
  if (!state.name.trim()) errors.name = 'Informe o nome do campeonato.'
  if (!state.seasonId) errors.seasonId = 'Selecione a temporada.'
  if (state.startDate && state.endDate && state.startDate > state.endDate) {
    errors.dateRange = 'A data de início deve ser anterior à de fim.'
  }
  return errors
}
