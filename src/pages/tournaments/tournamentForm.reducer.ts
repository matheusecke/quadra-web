import { toInstant } from '../../features/sports/tournamentDates'
import type { TournamentFormat } from '../../features/sports/types'
import type { CreateTournamentInput, EditableTournamentStatus, UpdateTournamentInput } from '../../services/sportsApi/types'

export interface TournamentFormState {
  name: string
  seasonId: number | null
  categoryId: number | null
  format: TournamentFormat
  status: EditableTournamentStatus
  /** Dias de calendário, no formato do `<input type="date">`. A conversão é na borda. */
  startsAt: string
  endsAt: string
  registrationStartsAt: string
  registrationEndsAt: string
  regulation: string
}

export type TournamentFormAction =
  | { [K in keyof TournamentFormState]: { type: 'setField'; field: K; value: TournamentFormState[K] } }[keyof TournamentFormState]
  | { type: 'load'; state: TournamentFormState }

export interface TournamentFormErrors {
  name?: string
  seasonId?: string
  dateRange?: string
  registrationRange?: string
}

export const initialTournamentFormState = (): TournamentFormState => ({
  name: '',
  seasonId: null,
  categoryId: null,
  format: 'LEAGUE',
  status: 'DRAFT',
  startsAt: '',
  endsAt: '',
  registrationStartsAt: '',
  registrationEndsAt: '',
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
  if (state.startsAt && state.endsAt && state.startsAt > state.endsAt) {
    errors.dateRange = 'A data de início deve ser anterior à de fim.'
  }
  if (state.registrationStartsAt && state.registrationEndsAt && state.registrationStartsAt > state.registrationEndsAt) {
    errors.registrationRange = 'A abertura das inscrições deve ser anterior ao encerramento.'
  }
  return errors
}

/** Na criação, campo vazio é omitido — a API guarda null por conta própria. */
export function toCreateInput(state: TournamentFormState): CreateTournamentInput {
  const input: CreateTournamentInput = {
    name: state.name.trim(),
    seasonId: state.seasonId!,
    format: state.format,
    status: state.status,
  }
  if (state.categoryId != null) input.categoryId = state.categoryId
  if (state.regulation.trim()) input.regulation = state.regulation.trim()
  const startsAt = toInstant(state.startsAt)
  if (startsAt) input.startsAt = startsAt
  const endsAt = toInstant(state.endsAt)
  if (endsAt) input.endsAt = endsAt
  const registrationStartsAt = toInstant(state.registrationStartsAt)
  if (registrationStartsAt) input.registrationStartsAt = registrationStartsAt
  const registrationEndsAt = toInstant(state.registrationEndsAt, true)
  if (registrationEndsAt) input.registrationEndsAt = registrationEndsAt
  return input
}

/** Na edição, campo vazio vira `null` — é assim que se limpa a coluna. */
export function toUpdateInput(state: TournamentFormState, isCompleted: boolean): UpdateTournamentInput {
  const input: UpdateTournamentInput = {
    name: state.name.trim(),
    seasonId: state.seasonId!,
    format: state.format,
    categoryId: state.categoryId,
    regulation: state.regulation.trim() || null,
    startsAt: toInstant(state.startsAt),
    endsAt: toInstant(state.endsAt),
    registrationStartsAt: toInstant(state.registrationStartsAt),
    registrationEndsAt: toInstant(state.registrationEndsAt, true),
  }
  // Mudar o status de um COMPLETED é 409: o caminho é /reopen, não PATCH.
  if (!isCompleted) input.status = state.status
  return input
}
