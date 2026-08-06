import { describe, expect, it } from 'vitest'
import {
  MATCH_STATUS_LABELS,
  TOURNAMENT_STATUS_LABELS,
  formatDiff,
  formatStatPct,
  formatMinutesSeconds,
  formatPct,
  matchPhaseName,
  matchStatusVariant,
  tournamentStatusVariant,
  teamMap,
  tournamentTeamMap,
  formatServerDecimal,
  formatServerPercentage,
  formatServerEfficiency,
  formatMeasuredGames,
  formatShootingLine,
} from './sportsUtils'
import type { StandingRow, TournamentTeam } from './types'

const row = (over: Partial<StandingRow>): StandingRow => ({
  position: 1, tournamentTeamId: 1001, teamId: 1, teamName: 'Alfa',
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

describe('formatMinutesSeconds', () => {
  it('formats stored seconds as unbounded minutes and padded seconds', () => {
    expect(formatMinutesSeconds(0)).toBe('0:00')
    expect(formatMinutesSeconds(2285)).toBe('38:05')
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
      bracketRound: { id: 1, number: 2, label: 'Semifinais' },
      tournamentGroupId: null,
    })).toBe('Semifinais')
  })

  it('returns Fase de grupos when the match belongs to a group and has no round', () => {
    expect(matchPhaseName({
      bracketRound: null,
      tournamentGroupId: 1,
    })).toBe('Fase de grupos')
  })

  it('returns null when the match has neither a round nor a group (league)', () => {
    expect(matchPhaseName({
      bracketRound: null,
      tournamentGroupId: null,
    })).toBeNull()
  })
})

describe('Phase 10 server-value formatters', () => {
  it('distinguishes unmeasured null from measured zero', () => {
    expect(formatServerDecimal(null)).toBe('N/A')
    expect(formatServerDecimal(0)).toBe('0')
    expect(formatShootingLine(null, 0)).toBe('N/A')
    expect(formatShootingLine(0, 0)).toBe('0/0')
  })

  it('keeps every server decimal instead of forcing a new precision', () => {
    expect(formatServerDecimal(24)).toBe('24')
    expect(formatServerDecimal(24.5)).toBe('24.5')
    expect(formatServerDecimal(24.125)).toBe('24.125')
  })

  it('formats fractional percentages without clamping values above one', () => {
    expect(formatServerPercentage(null)).toBe('N/A')
    expect(formatServerPercentage(0)).toBe('0%')
    expect(formatServerPercentage(0.429)).toBe('42.9%')
    expect(formatServerPercentage(1.4)).toBe('140%')
  })

  it('adds a sign only to positive server-owned efficiency', () => {
    expect(formatServerEfficiency(null)).toBe('N/A')
    expect(formatServerEfficiency(-2.5)).toBe('-2.5')
    expect(formatServerEfficiency(0)).toBe('0')
    expect(formatServerEfficiency(3.125)).toBe('+3.125')
  })

  it('labels the metric-specific measurement count with correct plurality', () => {
    expect(formatMeasuredGames(0)).toBe('em 0 jogos medidos')
    expect(formatMeasuredGames(1)).toBe('em 1 jogo medido')
    expect(formatMeasuredGames(4)).toBe('em 4 jogos medidos')
  })
})

describe('formatStatPct', () => {
  it('is N/A when a side was not tracked (null)', () => {
    expect(formatStatPct(null, 10)).toBe('N/A')
    expect(formatStatPct(4, null)).toBe('N/A')
  })

  it('is em dash when measured but zero attempts', () => {
    expect(formatStatPct(0, 0)).toBe('—')
  })

  it('formats a real percentage', () => {
    expect(formatStatPct(5, 10)).toBe('50.0')
  })
})

describe('formatMinutesSeconds', () => {
  it('is N/A for null', () => {
    expect(formatMinutesSeconds(null)).toBe('N/A')
  })
})

describe('tournamentTeamMap', () => {
  it('resolves a tournament team entry by its tournamentTeamId, using the enrollment snapshot name', () => {
    const teams = teamMap([{ id: 1, name: 'Time 1 (current)', shortName: 'T01', city: 'Campinas' }])
    const tournamentTeams: TournamentTeam[] = [
      { id: 1001, tournamentId: 1, teamId: 1, displayNameSnapshot: 'Time 1', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
    ]
    const map = tournamentTeamMap(tournamentTeams, teams)
    expect(map.get(1001)).toEqual({ name: 'Time 1', shortName: 'T01' })
  })

  it('omits an unresolved global team rather than throwing', () => {
    const tournamentTeams: TournamentTeam[] = [
      { id: 1001, tournamentId: 1, teamId: 999, displayNameSnapshot: 'Time Fantasma', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
    ]
    const map = tournamentTeamMap(tournamentTeams, new Map())
    expect(map.get(1001)).toEqual({ name: 'Time Fantasma', shortName: '' })
  })
})
