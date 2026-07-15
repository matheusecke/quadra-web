import { describe, it, expect } from 'vitest'
import { createSportsStore } from './store'
import type { PeriodScore } from '../../features/sports/types'

const period = (n: number, home: number, away: number): PeriodScore => ({
  periodNumber: n, type: 'REGULAR', overtimeNumber: null, homePoints: home, awayPoints: away,
})

const fresh = () => {
  const store = createSportsStore({ seasons: [], categories: [], tournaments: [], matches: [] })
  const season = store.createSeason({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' })
  const t = store.createTournament({ name: 'Copa', seasonId: season.id, categoryId: null, format: 'KNOCKOUT', startDate: '2026-02-01', endDate: '2026-06-01' })
  const alfa = store.enrollTeam({ tournamentId: t.id, teamId: 'team-1', displayName: 'Alfa' })
  const beta = store.enrollTeam({ tournamentId: t.id, teamId: 'team-2', displayName: 'Beta' })
  return { store, tournamentId: t.id, alfaId: alfa.id, betaId: beta.id }
}

describe('bracket store', () => {
  it('lists slots ordered by round then position', () => {
    const { store, tournamentId } = fresh()
    store.createBracketSlot({ tournamentId, roundNumber: 2, position: 1, label: 'Final' })
    store.createBracketSlot({ tournamentId, roundNumber: 1, position: 2, label: 'Semi 2' })
    store.createBracketSlot({ tournamentId, roundNumber: 1, position: 1, label: 'Semi 1' })
    expect(store.listBracketSlots(tournamentId).map((s) => s.label)).toEqual(['Semi 1', 'Semi 2', 'Final'])
  })

  it('gives a new slot the next free position in its round — nothing is typed', () => {
    const { store, tournamentId } = fresh()
    store.createBracketSlot({ tournamentId, roundNumber: 1 })
    const second = store.createBracketSlot({ tournamentId, roundNumber: 1 })
    expect(second.position).toBe(2)
  })

  it('fills a single side to represent a bye — no special rule', () => {
    const { store, tournamentId, alfaId } = fresh()
    const slot = store.createBracketSlot({ tournamentId, roundNumber: 2, label: 'Semifinal 1' })
    const updated = store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId })
    expect(updated.homeTournamentTeamId).toBe(alfaId)
    expect(updated.awayTournamentTeamId).toBeNull()
  })

  it('rejects a winner that is not one of the slot sides', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const slot = store.createBracketSlot({ tournamentId, roundNumber: 1 })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    expect(() => store.setSlotWinner({ slotId: slot.id, winnerTournamentTeamId: 'tt-nobody' })).toThrow(/one of the slot sides/i)
    expect(store.setSlotWinner({ slotId: slot.id, winnerTournamentTeamId: alfaId }).winnerTournamentTeamId).toBe(alfaId)
  })

  it('drops the winner when the winning side is cleared', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const slot = store.createBracketSlot({ tournamentId, roundNumber: 1 })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    store.setSlotWinner({ slotId: slot.id, winnerTournamentTeamId: alfaId })
    expect(store.updateBracketSlot(slot.id, { homeTournamentTeamId: null }).winnerTournamentTeamId).toBeNull()
  })

  it('cancels the scheduled match when its slot is removed', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const slot = store.createBracketSlot({ tournamentId, roundNumber: 1 })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    const match = store.scheduleMatch({ tournamentId, homeTeamId: 'team-1', awayTeamId: 'team-2', scheduledAt: '2026-03-01T18:00' })
    store.linkSlotMatch({ slotId: slot.id, matchId: match.id })

    store.removeBracketSlot(slot.id)

    expect(store.listBracketSlots(tournamentId)).toHaveLength(0)
    expect(store.listMatches({ tournamentId })[0].status).toBe('CANCELLED')
  })

  it('refuses to remove a slot whose match was already played', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const slot = store.createBracketSlot({ tournamentId, roundNumber: 1 })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    const match = store.scheduleMatch({ tournamentId, homeTeamId: 'team-1', awayTeamId: 'team-2', scheduledAt: '2026-03-01T18:00' })
    store.linkSlotMatch({ slotId: slot.id, matchId: match.id })
    store.submitMatchResult({ matchId: match.id, periods: [period(1, 80, 70)], playerStats: [] })

    expect(() => store.removeBracketSlot(slot.id)).toThrow(/match is finished/i)
    expect(store.listBracketSlots(tournamentId)).toHaveLength(1)
  })
})
