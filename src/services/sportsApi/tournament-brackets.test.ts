import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import {
  createBracketRound,
  createBracketSlot,
  getBracket,
  removeBracketRound,
  removeBracketSlot,
  updateBracketRound,
  updateBracketSlot,
} from './tournament-brackets'

const readEnvelope = {
  data: {
    rounds: [
      {
        id: 10,
        number: 1,
        label: 'Semifinais',
        slots: [
          {
            id: 101, position: 1, label: null,
            homeTeam: { tournamentTeamId: 21, name: 'Engenharia', shortName: 'ENG' },
            awayTeam: { tournamentTeamId: 22, name: 'Medicina', shortName: 'MED' },
            match: null, winnerTournamentTeamId: null,
          },
          {
            id: 102, position: 2, label: null,
            homeTeam: { tournamentTeamId: 23, name: 'Direito', shortName: 'DIR' },
            awayTeam: null, match: null, winnerTournamentTeamId: null,
          },
        ],
      },
      { id: 11, number: 2, label: 'Final', slots: [] },
    ],
  },
  statusCode: 200,
}

const roundRow = {
  id: 10, tournamentId: 12, number: 1, label: 'Semifinais',
  createdAt: '2026-07-28T18:00:00.000Z', updatedAt: '2026-07-28T18:00:00.000Z',
}

const slotRow = {
  id: 101, tournamentId: 12, roundId: 10, position: 1, label: null,
  homeTournamentTeamId: 21, awayTournamentTeamId: 22, matchId: null, winnerTournamentTeamId: null,
  createdAt: '2026-07-28T18:05:00.000Z', updatedAt: '2026-07-28T18:05:00.000Z',
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
  apiMock.patch.mockReset()
  apiMock.delete.mockReset()
})

describe('getBracket', () => {
  it('reads the bracket without any query parameter', async () => {
    apiMock.get.mockResolvedValue({ data: readEnvelope })
    await getBracket(12)
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/12/bracket')
  })

  it('returns the rounds with the tournament id filled in from the argument', async () => {
    apiMock.get.mockResolvedValue({ data: readEnvelope })
    const { rounds } = await getBracket(12)
    expect(rounds).toEqual([
      { id: 10, tournamentId: 12, number: 1, label: 'Semifinais' },
      { id: 11, tournamentId: 12, number: 2, label: 'Final' },
    ])
  })

  it('flattens the slots and copies roundId from the parent round', async () => {
    apiMock.get.mockResolvedValue({ data: readEnvelope })
    const { slots } = await getBracket(12)
    expect(slots.map((slot) => [slot.id, slot.roundId])).toEqual([[101, 10], [102, 10]])
  })

  it('keeps the embedded team names on the slot and drops the always-null match', async () => {
    apiMock.get.mockResolvedValue({ data: readEnvelope })
    const { slots } = await getBracket(12)
    expect(slots[0]).toEqual({
      id: 101, roundId: 10, position: 1, label: null,
      homeTeam: { tournamentTeamId: 21, name: 'Engenharia', shortName: 'ENG' },
      awayTeam: { tournamentTeamId: 22, name: 'Medicina', shortName: 'MED' },
      winnerTournamentTeamId: null,
    })
  })

  it('answers an empty bracket with two empty lists', async () => {
    apiMock.get.mockResolvedValue({ data: { data: { rounds: [] }, statusCode: 200 } })
    expect(await getBracket(12)).toEqual({ rounds: [], slots: [] })
  })
})

describe('bracket rounds', () => {
  it('posts the number and label to the tournament route', async () => {
    apiMock.post.mockResolvedValue({ data: { data: roundRow, statusCode: 201 } })
    await createBracketRound({ tournamentId: 12, number: 1, label: 'Semifinais' })
    expect(apiMock.post).toHaveBeenCalledWith('/tournaments/12/bracket-rounds', { number: 1, label: 'Semifinais' })
  })

  it('unwraps the created round', async () => {
    apiMock.post.mockResolvedValue({ data: { data: roundRow, statusCode: 201 } })
    expect(await createBracketRound({ tournamentId: 12, number: 1 })).toEqual(roundRow)
  })

  it('patches a round by its own id, sending null to clear the label', async () => {
    apiMock.patch.mockResolvedValue({ data: { data: { ...roundRow, label: null }, statusCode: 200 } })
    await updateBracketRound(10, { label: null })
    expect(apiMock.patch).toHaveBeenCalledWith('/tournament-bracket-rounds/10', { label: null })
  })

  it('resolves undefined on delete without reading a body', async () => {
    apiMock.delete.mockResolvedValue({ status: 204 })
    expect(await removeBracketRound(10)).toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/tournament-bracket-rounds/10')
  })
})

describe('bracket slots', () => {
  it('posts the round in the body, not the path', async () => {
    apiMock.post.mockResolvedValue({ data: { data: slotRow, statusCode: 201 } })
    await createBracketSlot({ roundId: 10, position: 1, homeTournamentTeamId: 21, awayTournamentTeamId: 22 })
    expect(apiMock.post).toHaveBeenCalledWith('/tournament-bracket-slots', {
      roundId: 10, position: 1, homeTournamentTeamId: 21, awayTournamentTeamId: 22,
    })
  })

  it('unwraps the flat written row, matchId included', async () => {
    apiMock.post.mockResolvedValue({ data: { data: slotRow, statusCode: 201 } })
    expect(await createBracketSlot({ roundId: 10, position: 1 })).toEqual(slotRow)
  })

  it('patches only the side it was given', async () => {
    apiMock.patch.mockResolvedValue({ data: { data: slotRow, statusCode: 200 } })
    await updateBracketSlot(102, { awayTournamentTeamId: null })
    expect(apiMock.patch).toHaveBeenCalledWith('/tournament-bracket-slots/102', { awayTournamentTeamId: null })
  })

  it('resolves undefined on delete without reading a body', async () => {
    apiMock.delete.mockResolvedValue({ status: 204 })
    expect(await removeBracketSlot(102)).toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/tournament-bracket-slots/102')
  })
})
