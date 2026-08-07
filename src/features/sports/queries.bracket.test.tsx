import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import { useBracketQuery, useCreateBracketRound, useCreateBracketSlot, useRemoveBracketSlot } from './queries'
import type { BracketRound, BracketSlot } from './types'

afterEach(() => vi.restoreAllMocks())

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const round: BracketRound = { id: 10, tournamentId: 12, number: 1, label: 'Semifinais' }

const emptyBracket = { rounds: [], slots: [] }

describe('useBracketQuery', () => {
  it('reads the whole bracket in a single call', async () => {
    const getBracket = vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({
      rounds: [round],
      slots: [{ id: 101, roundId: 10, position: 1, label: null, homeTeam: null, awayTeam: null, match: null, winnerTournamentTeamId: null }],
    })
    const { result } = renderHook(() => useBracketQuery(12), { wrapper })
    await waitFor(() => expect(result.current.data?.slots).toHaveLength(1))
    expect(getBracket).toHaveBeenCalledExactlyOnceWith(12)
  })

  it('stays idle without a tournament', () => {
    const getBracket = vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(emptyBracket)
    renderHook(() => useBracketQuery(undefined), { wrapper })
    expect(getBracket).not.toHaveBeenCalled()
  })
})

describe('bracket mutations', () => {
  it('refetches the bracket after a round is created', async () => {
    const getBracket = vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(emptyBracket)
    vi.spyOn(sportsApi, 'createBracketRound').mockResolvedValue(round)
    const { result } = renderHook(() => ({ list: useBracketQuery(12), create: useCreateBracketRound() }), { wrapper })
    await waitFor(() => expect(getBracket).toHaveBeenCalledTimes(1))
    await result.current.create.mutateAsync({ tournamentId: 12, number: 1, label: 'Semifinais' })
    await waitFor(() => expect(getBracket).toHaveBeenCalledTimes(2))
  })

  it('refetches the bracket after a slot is removed', async () => {
    const getBracket = vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(emptyBracket)
    vi.spyOn(sportsApi, 'removeBracketSlot').mockResolvedValue(undefined)
    const { result } = renderHook(() => ({ list: useBracketQuery(12), remove: useRemoveBracketSlot() }), { wrapper })
    await waitFor(() => expect(getBracket).toHaveBeenCalledTimes(1))
    await result.current.remove.mutateAsync(101)
    await waitFor(() => expect(getBracket).toHaveBeenCalledTimes(2))
  })
})

/** Kept honest: the write response is the flat row, not the enriched read node. */
describe('write responses', () => {
  it('hands back the persisted slot row untouched', async () => {
    const row: BracketSlot = {
      id: 101, tournamentId: 12, roundId: 10, position: 1, label: null,
      homeTournamentTeamId: 21, awayTournamentTeamId: null, matchId: null, winnerTournamentTeamId: null,
    }
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(emptyBracket)
    vi.spyOn(sportsApi, 'createBracketSlot').mockResolvedValue(row)
    const { result } = renderHook(() => useCreateBracketSlot(), { wrapper })
    expect(await result.current.mutateAsync({ roundId: 10, position: 1 })).toEqual(row)
  })
})
