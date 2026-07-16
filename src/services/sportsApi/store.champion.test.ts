import { describe, it, expect } from 'vitest'
import { createSportsStore } from './store'

const knockout = () => {
  const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
  const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
  const t = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'KNOCKOUT', startDate: '2026-02-01', endDate: '2026-06-01' })
  store.updateTournament(t.id, { status: 'IN_PROGRESS' })
  const alfa = store.enrollTeam({ tournamentId: t.id, teamId: 'team-1', displayName: 'Alfa' })
  const beta = store.enrollTeam({ tournamentId: t.id, teamId: 'team-2', displayName: 'Beta' })
  const round = store.createBracketRound({ tournamentId: t.id, label: 'Final' })
  const final = store.createBracketSlot({ tournamentId: t.id, roundId: round.id, label: 'Final' })
  store.updateBracketSlot(final.id, { homeTournamentTeamId: alfa.id, awayTournamentTeamId: beta.id })
  store.setSlotWinner({ slotId: final.id, winnerTournamentTeamId: alfa.id })
  return { store, tournamentId: t.id, alfaId: alfa.id, betaId: beta.id, finalId: final.id, roundId: round.id }
}

describe('championSuggestion', () => {
  it('suggests the winner of the final when the last round holds exactly one slot', () => {
    const { store, tournamentId, alfaId } = knockout()
    expect(store.championSuggestion(tournamentId)).toBe(alfaId)
  })
  it('suggests nothing when the last round is ambiguous — two slots are not a final', () => {
    const { store, tournamentId, roundId } = knockout()
    store.createBracketSlot({ tournamentId, roundId, label: 'Disputa de 3º lugar' })
    expect(store.championSuggestion(tournamentId)).toBeNull()
  })
})

describe('completeTournament', () => {
  it('writes the champion and the COMPLETED status together', () => {
    const { store, tournamentId, alfaId } = knockout()
    const tournament = store.completeTournament({ tournamentId, championTournamentTeamId: alfaId })
    expect(tournament.status).toBe('COMPLETED')
    expect(tournament.championTournamentTeamId).toBe(alfaId)
  })
  it('refuses to complete a knockout with no champion — there is no "finished, nobody won"', () => {
    const { store, tournamentId } = knockout()
    expect(() => store.completeTournament({ tournamentId, championTournamentTeamId: null })).toThrow(/champion is required/i)
  })
  it('refuses to crown a team that never won a slot', () => {
    const { store, tournamentId, betaId } = knockout()
    expect(() => store.completeTournament({ tournamentId, championTournamentTeamId: betaId })).toThrow(/won a bracket slot/i)
  })
  it('reopens the tournament and drops the title when a slot winner changes', () => {
    const { store, tournamentId, alfaId, betaId, finalId } = knockout()
    store.completeTournament({ tournamentId, championTournamentTeamId: alfaId })
    store.setSlotWinner({ slotId: finalId, winnerTournamentTeamId: betaId })
    expect(store.getTournament(tournamentId)?.status).toBe('IN_PROGRESS')
    expect(store.getTournament(tournamentId)?.championTournamentTeamId).toBeNull()
  })
  it('reopens on demand', () => {
    const { store, tournamentId, alfaId } = knockout()
    store.completeTournament({ tournamentId, championTournamentTeamId: alfaId })
    const tournament = store.reopenTournament({ tournamentId })
    expect(tournament.status).toBe('IN_PROGRESS')
    expect(tournament.championTournamentTeamId).toBeNull()
  })
})
