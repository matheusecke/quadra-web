import { describe, expect, it } from 'vitest'
import { createSportsStore } from './store'
import type { BracketRound, BracketSlot, Match } from '../../features/sports/types'

const TOURNAMENT_ID = 1
const MATCH_ID = 900

const match: Match = {
  id: MATCH_ID, tournamentId: TOURNAMENT_ID, date: '2026-03-01T20:00:00Z',
  homeTournamentTeamId: 1, awayTournamentTeamId: 2, homeScore: null, awayScore: null,
  status: 'SCHEDULED', tournamentGroupId: null, bracketRound: null,
  homeLossType: null, awayLossType: null, scoreSource: null,
}

const round: BracketRound = { id: 5, tournamentId: TOURNAMENT_ID, number: 1, label: 'Semifinais' }

const slot = (over: Partial<BracketSlot> = {}): BracketSlot => ({
  id: 50, tournamentId: TOURNAMENT_ID, roundId: round.id, position: 1, label: null,
  homeTournamentTeamId: null, awayTournamentTeamId: null, matchId: MATCH_ID,
  winnerTournamentTeamId: null, ...over,
})

const bracketRoundOfMatch = (bracketSlots: BracketSlot[]) =>
  createSportsStore({ matches: [match], bracketRounds: [round], bracketSlots })
    .listMatches({ tournamentId: TOURNAMENT_ID })
    .find((entry) => entry.id === MATCH_ID)?.bracketRound

describe('mocked matches still derive their knockout phase from the seeded bracket', () => {
  it('labels a match linked to a slot with that slot round', () => {
    expect(bracketRoundOfMatch([slot()])).toEqual({ id: 5, number: 1, label: 'Semifinais' })
  })

  it('leaves a match with no slot outside the bracket', () => {
    expect(bracketRoundOfMatch([slot({ matchId: null })])).toBeNull()
  })
})
