import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import { useClearTiebreakOrder, useSetTiebreakOrder, useStandingsQuery } from './queries'
import type { StandingRow, StandingsEnvelope } from './types'

/** One client per test, shared by every renderHook call in it — invalidation only
 *  crosses hooks that share a QueryClient instance. */
function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => vi.restoreAllMocks())

const row = (over: Partial<StandingRow>): StandingRow => ({
  position: 1, tournamentTeamId: 58, teamId: 5, teamName: 'Direito',
  played: 2, wins: 1, losses: 1, classificationPoints: 3,
  pointsFor: 150, pointsAgainst: 150, pointDiff: 0, winPct: 0.5,
  isTiedUnresolved: true, tieBlockKey: '58-63',
  ...over,
})

const envelope = (rows: StandingRow[]): StandingsEnvelope => ({
  group: { id: 7, name: 'Grupo A' },
  standingsState: 'PARTIAL',
  pendingMatches: 2,
  rows,
})

const tied = envelope([row({}), row({ position: 2, tournamentTeamId: 63, teamId: 8, teamName: 'Medicina' })])
const resolved = envelope([
  row({ position: 1, tournamentTeamId: 63, teamId: 8, teamName: 'Medicina', isTiedUnresolved: false }),
  row({ position: 2, isTiedUnresolved: false }),
])

describe('standings queries', () => {
  it('loads the tables of a tournament', async () => {
    vi.spyOn(sportsApi, 'listStandings').mockResolvedValue([tied])
    const list = renderHook(() => useStandingsQuery(12), { wrapper: makeWrapper() })
    await waitFor(() => expect(list.result.current.data).toEqual([tied]))
    expect(sportsApi.listStandings).toHaveBeenCalledWith(12)
  })

  it('stays disabled without a tournament id', () => {
    const listStandings = vi.spyOn(sportsApi, 'listStandings').mockResolvedValue([])
    const list = renderHook(() => useStandingsQuery(undefined), { wrapper: makeWrapper() })
    expect(list.result.current.fetchStatus).toBe('idle')
    expect(listStandings).not.toHaveBeenCalled()
  })

  it('shows the recomputed tables the draw answered with, without reading again', async () => {
    const listStandings = vi.spyOn(sportsApi, 'listStandings').mockResolvedValue([tied])
    vi.spyOn(sportsApi, 'setTiebreakOrder').mockResolvedValue([resolved])

    const wrapper = makeWrapper()
    const list = renderHook(() => useStandingsQuery(12), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([tied]))

    const set = renderHook(() => useSetTiebreakOrder(), { wrapper })
    const entries = [
      { tournamentTeamId: 63, order: 1 },
      { tournamentTeamId: 58, order: 2 },
    ]
    await set.result.current.mutateAsync({ tournamentId: 12, entries })

    expect(sportsApi.setTiebreakOrder).toHaveBeenCalledWith({ tournamentId: 12, entries })
    await waitFor(() => expect(list.result.current.data).toEqual([resolved]))
    expect(listStandings).toHaveBeenCalledTimes(1)
  })

  it('reloads the tables after clearing a draw', async () => {
    vi.spyOn(sportsApi, 'listStandings').mockResolvedValueOnce([resolved]).mockResolvedValueOnce([tied])
    vi.spyOn(sportsApi, 'clearTiebreakOrder').mockResolvedValue(undefined)

    const wrapper = makeWrapper()
    const list = renderHook(() => useStandingsQuery(12), { wrapper })
    await waitFor(() => expect(list.result.current.data).toEqual([resolved]))

    const clear = renderHook(() => useClearTiebreakOrder(), { wrapper })
    await clear.result.current.mutateAsync({ tournamentId: 12, blockKey: '58-63' })

    expect(sportsApi.clearTiebreakOrder).toHaveBeenCalledWith({ tournamentId: 12, blockKey: '58-63' })
    await waitFor(() => expect(list.result.current.data).toEqual([tied]))
  })
})
