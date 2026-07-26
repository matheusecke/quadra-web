import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import {
  addTournamentRoster,
  getTournamentRoster,
  removeTournamentRoster,
  updateTournamentRoster,
} from './tournament-rosters'

const roster88 = {
  id: 88, tournamentId: 12, tournamentTeamId: 41, userId: 165, role: 'ATHLETE' as const,
  jerseyNumber: 4, displayNameSnapshot: 'Rafael Moura',
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
  apiMock.patch.mockReset()
  apiMock.delete.mockReset()
})

describe('tournament-rosters adapter', () => {
  it('gets the unpaginated roster without query parameters', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [roster88], statusCode: 200 } })
    await expect(getTournamentRoster(41)).resolves.toEqual([roster88])
    expect(apiMock.get).toHaveBeenCalledWith('/tournament-teams/41/tournament-rosters')
  })

  it('creates with userId and omits an absent jerseyNumber', async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: roster88, statusCode: 201 } })
    await addTournamentRoster({ userId: 165, tournamentTeamId: 41, role: 'ATHLETE' })
    expect(apiMock.post).toHaveBeenCalledWith('/tournament-rosters', {
      userId: 165, tournamentTeamId: 41, role: 'ATHLETE',
    })
  })

  it('sends a jerseyNumber of 0 without dropping it as falsy', async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { ...roster88, jerseyNumber: 0 }, statusCode: 201 } })
    await addTournamentRoster({ userId: 165, tournamentTeamId: 41, role: 'ATHLETE', jerseyNumber: 0 })
    expect(apiMock.post).toHaveBeenCalledWith('/tournament-rosters', {
      userId: 165, tournamentTeamId: 41, role: 'ATHLETE', jerseyNumber: 0,
    })
  })

  it('preserves an explicit null jerseyNumber', async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { ...roster88, jerseyNumber: null }, statusCode: 200 } })
    await updateTournamentRoster(88, { jerseyNumber: null })
    expect(apiMock.patch).toHaveBeenCalledWith('/tournament-rosters/88', { jerseyNumber: null })
  })

  it('withdraws a roster row on 204', async () => {
    apiMock.delete.mockResolvedValueOnce({ status: 204 })
    await expect(removeTournamentRoster(88)).resolves.toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/tournament-rosters/88')
  })
})
