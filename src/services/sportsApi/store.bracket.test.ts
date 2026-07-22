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
  const alfa = store.enrollTeam({ tournamentId: t.id, teamId: 1, displayName: 'Alfa' })
  const beta = store.enrollTeam({ tournamentId: t.id, teamId: 2, displayName: 'Beta' })
  return { store, tournamentId: t.id, alfaId: alfa.id, betaId: beta.id }
}

describe('bracket store', () => {
  it('lists slots ordered by round then position', () => {
    const { store, tournamentId } = fresh()
    const final = store.createBracketRound({ tournamentId, number: 2, label: 'Final' })
    const semis = store.createBracketRound({ tournamentId, number: 1, label: 'Semifinais' })
    store.createBracketSlot({ tournamentId, roundId: final.id, position: 1, label: 'Final' })
    store.createBracketSlot({ tournamentId, roundId: semis.id, position: 2, label: 'Semi 2' })
    store.createBracketSlot({ tournamentId, roundId: semis.id, position: 1, label: 'Semi 1' })
    expect(store.listBracketSlots(tournamentId).map((s) => s.label)).toEqual(['Semi 1', 'Semi 2', 'Final'])
  })

  it('gives a new slot the next free position in its round — nothing is typed', () => {
    const { store, tournamentId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Semifinais' })
    store.createBracketSlot({ tournamentId, roundId: round.id })
    const second = store.createBracketSlot({ tournamentId, roundId: round.id })
    expect(second.position).toBe(2)
  })

  it('fills a single side to represent a bye — no special rule', () => {
    const { store, tournamentId, alfaId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Semifinais' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id, label: 'Semifinal 1' })
    const updated = store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId })
    expect(updated.homeTournamentTeamId).toBe(alfaId)
    expect(updated.awayTournamentTeamId).toBeNull()
  })

  it('rejects a winner that is not one of the slot sides', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Final' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    expect(() => store.setSlotWinner({ slotId: slot.id, winnerTournamentTeamId: 999999 })).toThrow(/one of the slot sides/i)
    expect(store.setSlotWinner({ slotId: slot.id, winnerTournamentTeamId: alfaId }).winnerTournamentTeamId).toBe(alfaId)
  })

  it('drops the winner when the winning side is cleared', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Final' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    store.setSlotWinner({ slotId: slot.id, winnerTournamentTeamId: alfaId })
    expect(store.updateBracketSlot(slot.id, { homeTournamentTeamId: null }).winnerTournamentTeamId).toBeNull()
  })

  it('cancels the scheduled match when its slot is removed', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Final' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    const match = store.scheduleMatch({ tournamentId, homeTeamId: 1, awayTeamId: 2, scheduledAt: '2026-03-01T18:00' })
    store.linkSlotMatch({ slotId: slot.id, matchId: match.id })

    store.removeBracketSlot(slot.id)

    expect(store.listBracketSlots(tournamentId)).toHaveLength(0)
    expect(store.listMatches({ tournamentId })[0].status).toBe('CANCELLED')
  })

  it('refuses to remove a slot whose match was already played', () => {
    const { store, tournamentId, alfaId, betaId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Final' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id })
    store.updateBracketSlot(slot.id, { homeTournamentTeamId: alfaId, awayTournamentTeamId: betaId })
    const match = store.scheduleMatch({ tournamentId, homeTeamId: 1, awayTeamId: 2, scheduledAt: '2026-03-01T18:00' })
    store.linkSlotMatch({ slotId: slot.id, matchId: match.id })
    store.submitMatchResult({ matchId: match.id, periods: [period(1, 80, 70)], playerStats: [] })

    expect(() => store.removeBracketSlot(slot.id)).toThrow(/match is finished/i)
    expect(store.listBracketSlots(tournamentId)).toHaveLength(1)
  })

  it('orders rounds by number', () => {
    const { store, tournamentId } = fresh()
    store.createBracketRound({ tournamentId, number: 2, label: 'Final' })
    store.createBracketRound({ tournamentId, number: 1, label: 'Semifinais' })
    expect(store.listBracketRounds(tournamentId).map((round) => round.label)).toEqual(['Semifinais', 'Final'])
  })

  it('numbers a new round after the highest active one', () => {
    const { store, tournamentId } = fresh()
    store.createBracketRound({ tournamentId, label: 'Semifinais' })
    expect(store.createBracketRound({ tournamentId, label: 'Final' }).number).toBe(2)
  })

  it('renames a round', () => {
    const { store, tournamentId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Semis' })
    expect(store.updateBracketRound(round.id, { label: 'Semifinais' }).label).toBe('Semifinais')
  })

  it('removes a round that has no slots', () => {
    const { store, tournamentId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Final' })
    store.removeBracketRound(round.id)
    expect(store.listBracketRounds(tournamentId)).toHaveLength(0)
  })

  it('refuses to remove a round that still has active slots', () => {
    const { store, tournamentId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Final' })
    store.createBracketSlot({ tournamentId, roundId: round.id })
    expect(() => store.removeBracketRound(round.id)).toThrow('Cannot remove a round that still has slots')
  })

  it('removes a round once its slots are gone', () => {
    const { store, tournamentId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Final' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id })
    store.removeBracketSlot(slot.id)
    store.removeBracketRound(round.id)
    expect(store.listBracketRounds(tournamentId)).toHaveLength(0)
  })

  it('refuses a slot whose round belongs to another tournament', () => {
    const { store, tournamentId } = fresh()
    const season = store.createSeason({ label: '2027', startDate: '2027-01-01', endDate: '2027-12-31' })
    const otherTournament = store.createTournament({ name: 'Outra Copa', seasonId: season.id, categoryId: null, format: 'KNOCKOUT', startDate: '2027-02-01', endDate: '2027-06-01' })
    const round = store.createBracketRound({ tournamentId: otherTournament.id, label: 'Final' })
    expect(() => store.createBracketSlot({ tournamentId, roundId: round.id })).toThrow('Round does not belong to this tournament')
  })

  it('derives the round of a match from the slot it fills', () => {
    const { store, tournamentId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Semifinais' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id })
    const match = store.scheduleMatch({ tournamentId, homeTeamId: 1, awayTeamId: 2, scheduledAt: '2026-03-01T18:00' })
    store.linkSlotMatch({ slotId: slot.id, matchId: match.id })
    expect(store.listMatches({ tournamentId }).find((m) => m.id === match.id)?.bracketRound?.label).toBe('Semifinais')
  })

  it('gives no round to a match that fills no slot', () => {
    const { store, tournamentId } = fresh()
    const match = store.scheduleMatch({ tournamentId, homeTeamId: 1, awayTeamId: 2, scheduledAt: '2026-03-01T18:00' })
    expect(store.listMatches({ tournamentId }).find((m) => m.id === match.id)?.bracketRound).toBeNull()
  })

  it('follows the round rename, because the match never copied the name', () => {
    const { store, tournamentId } = fresh()
    const round = store.createBracketRound({ tournamentId, label: 'Semis' })
    const slot = store.createBracketSlot({ tournamentId, roundId: round.id })
    const match = store.scheduleMatch({ tournamentId, homeTeamId: 1, awayTeamId: 2, scheduledAt: '2026-03-01T18:00' })
    store.linkSlotMatch({ slotId: slot.id, matchId: match.id })
    store.updateBracketRound(round.id, { label: 'Semifinais' })
    expect(store.listMatches({ tournamentId }).find((m) => m.id === match.id)?.bracketRound?.label).toBe('Semifinais')
  })
})
