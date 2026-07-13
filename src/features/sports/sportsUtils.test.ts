import { describe, expect, it } from 'vitest'
import {
  MATCH_STATUS_LABELS,
  TOURNAMENT_STATUS_LABELS,
  matchStatusVariant,
  tournamentStatusVariant,
} from './sportsUtils'

describe('TOURNAMENT_STATUS_LABELS', () => {
  it('labels every tournament status in PT-BR', () => {
    expect(TOURNAMENT_STATUS_LABELS).toEqual({
      DRAFT: 'Rascunho',
      REGISTRATION: 'Inscrições',
      IN_PROGRESS: 'Em andamento',
      COMPLETED: 'Encerrado',
      CANCELLED: 'Cancelado',
    })
  })
})

describe('MATCH_STATUS_LABELS', () => {
  it('labels a cancelled match', () => {
    expect(MATCH_STATUS_LABELS.CANCELLED).toBe('Cancelada')
  })
})

describe('tournamentStatusVariant', () => {
  it('marks a draft as ghost, since it is not yet public', () => {
    expect(tournamentStatusVariant('DRAFT')).toBe('ghost')
  })

  it('marks a cancelled tournament as danger', () => {
    expect(tournamentStatusVariant('CANCELLED')).toBe('danger')
  })
})

describe('matchStatusVariant', () => {
  it('marks a cancelled match as danger, distinct from a postponed one', () => {
    expect(matchStatusVariant('CANCELLED')).toBe('danger')
    expect(matchStatusVariant('POSTPONED')).toBe('warning')
  })
})
