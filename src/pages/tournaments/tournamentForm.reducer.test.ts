import { describe, it, expect } from 'vitest'
import {
  initialTournamentFormState,
  toCreateInput,
  toUpdateInput,
  tournamentFormReducer,
  validateTournamentForm,
} from './tournamentForm.reducer'

describe('tournamentFormReducer', () => {
  it('updates the field being set', () => {
    const next = tournamentFormReducer(initialTournamentFormState(), { type: 'setField', field: 'name', value: 'Copa' })
    expect(next.name).toBe('Copa')
  })
})

describe('validateTournamentForm', () => {
  it('returns a date-range error when start is after end', () => {
    const state = { ...initialTournamentFormState(), name: 'Copa', seasonId: 1, startDate: '2026-06-01', endDate: '2026-02-01' }
    expect(validateTournamentForm(state).dateRange).toBeTruthy()
  })
  it('returns no errors for a valid range', () => {
    const state = { ...initialTournamentFormState(), name: 'Copa', seasonId: 1, startDate: '2026-02-01', endDate: '2026-06-01' }
    expect(validateTournamentForm(state)).toEqual({})
  })
})

const filled = {
  ...initialTournamentFormState(),
  name: 'Copa de Verão', seasonId: 3, format: 'LEAGUE' as const, status: 'IN_PROGRESS' as const,
}

describe('toCreateInput / toUpdateInput', () => {
  it('omite datas vazias na criação', () => {
    expect(toCreateInput(filled)).not.toHaveProperty('startsAt')
  })

  it('envia null na edição para limpar a coluna', () => {
    expect(toUpdateInput(filled, false).startsAt).toBeNull()
  })

  it('não envia status de um campeonato encerrado', () => {
    expect(toUpdateInput(filled, true)).not.toHaveProperty('status')
  })

  it('reprova uma janela de inscrição invertida', () => {
    const errors = validateTournamentForm({ ...filled, registrationStartsAt: '2025-12-15', registrationEndsAt: '2025-11-01' })
    expect(errors.registrationRange).toBe('A abertura das inscrições deve ser anterior ao encerramento.')
  })
})
