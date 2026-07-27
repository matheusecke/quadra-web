import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import { clearTiebreakOrder, listStandings, setTiebreakOrder } from './standings'

const groupATable = {
  group: { id: 7, name: 'Grupo A' },
  standingsState: 'PARTIAL' as const,
  pendingMatches: 2,
  rows: [
    {
      position: 1, tournamentTeamId: 41, teamId: 3, teamName: 'Engenharia',
      played: 2, wins: 2, losses: 0, classificationPoints: 4,
      pointsFor: 160, pointsAgainst: 140, pointDiff: 20, winPct: 1,
      isTiedUnresolved: false, tieBlockKey: null,
    },
  ],
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.put.mockReset()
  apiMock.delete.mockReset()
})

describe('standings adapter', () => {
  it('reads every table of the tournament without a group filter', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [groupATable], statusCode: 200 } })
    await expect(listStandings(12)).resolves.toEqual([groupATable])
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/12/standings', { params: { groupId: undefined } })
  })

  it('forwards the group filter as a query parameter', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [groupATable], statusCode: 200 } })
    await listStandings(12, 7)
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments/12/standings', { params: { groupId: 7 } })
  })

  it('resolves the empty list a knockout tournament answers with', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [], statusCode: 200 } })
    await expect(listStandings(31)).resolves.toEqual([])
  })

  it('registers a draw with the whole block and resolves the recomputed tables', async () => {
    apiMock.put.mockResolvedValueOnce({ data: { data: [groupATable], statusCode: 200 } })
    const entries = [
      { tournamentTeamId: 63, order: 1 },
      { tournamentTeamId: 58, order: 2 },
    ]
    await expect(setTiebreakOrder({ tournamentId: 12, entries })).resolves.toEqual([groupATable])
    expect(apiMock.put).toHaveBeenCalledWith('/tournaments/12/tiebreaks', { entries })
  })

  it('clears a draw by block key without reading a response body', async () => {
    apiMock.delete.mockResolvedValueOnce({ status: 204 })
    await expect(clearTiebreakOrder({ tournamentId: 12, blockKey: '58-63' })).resolves.toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/tournaments/12/tiebreaks/58-63')
  })
})
