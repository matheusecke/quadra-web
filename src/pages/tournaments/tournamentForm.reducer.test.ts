import { describe, it, expect } from 'vitest'
import { initialTournamentFormState, tournamentFormReducer, validateTournamentForm } from './tournamentForm.reducer'

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
