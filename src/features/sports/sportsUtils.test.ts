import { describe, expect, it } from 'vitest'
import {
  MATCH_STATUS_LABELS,
  TOURNAMENT_STATUS_LABELS,
  formatDiff,
  formatPct,
  matchPhaseName,
  matchStatusVariant,
  tournamentStatusVariant,
} from './sportsUtils'
import type { StandingRow } from './types'

const row = (over: Partial<StandingRow>): StandingRow => ({
  position: 1, tournamentTeamId: 'tt-1', teamId: 'team-1', teamName: 'Alfa',
  played: 4, wins: 3, losses: 1, classificationPoints: 7,
  pointsFor: 312, pointsAgainst: 288, pointDiff: 24, winPct: 0.75,
  isTiedUnresolved: false, tieBlockKey: null, ...over,
})

describe('formatPct', () => {
  it('formats the win percentage the row carries, basketball style', () => {
    expect(formatPct(row({}))).toBe('.750')
  })

  it('renders a dash when the row was never measured — never 0%', () => {
    expect(formatPct(row({ played: 0, wins: 0, losses: 0, winPct: null }))).toBe('—')
  })
})

describe('formatDiff', () => {
  it('reads the differential the data layer computed instead of re-deriving it', () => {
    expect(formatDiff(row({ pointsFor: 150, pointsAgainst: 140, pointDiff: 24 }))).toBe('+24')
  })

  it('keeps the sign of a negative differential', () => {
    expect(formatDiff(row({ pointDiff: -8 }))).toBe('-8')
  })
})

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

describe('matchPhaseName', () => {
  it('returns the bracket round label when the match is linked to a round', () => {
    expect(matchPhaseName({
      bracketRound: { id: 'r1', number: 2, label: 'Semifinais' },
      tournamentGroupId: null,
    })).toBe('Semifinais')
  })

  it('returns Fase de grupos when the match belongs to a group and has no round', () => {
    expect(matchPhaseName({
      bracketRound: null,
      tournamentGroupId: 'seed-group-a',
    })).toBe('Fase de grupos')
  })

  it('returns null when the match has neither a round nor a group (league)', () => {
    expect(matchPhaseName({
      bracketRound: null,
      tournamentGroupId: null,
    })).toBeNull()
  })
})
