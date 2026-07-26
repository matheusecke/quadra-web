import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as sportsApi from '../../services/sportsApi'
import { bracketLayout } from './bracketLayout'
import { useBracketView } from './useBracketView'
import { SEED_TOURNAMENT, tournamentTeamId } from './seedIds'
import type { Team, TournamentTeam } from './types'

const GERAL_TEAMS: Team[] = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1, name: `Time ${i + 1}`, shortName: `T${String(i + 1).padStart(2, '0')}`, city: 'Campinas',
}))

const GERAL_TOURNAMENT_TEAMS: TournamentTeam[] = GERAL_TEAMS.map((team) => ({
  id: tournamentTeamId(SEED_TOURNAMENT.GERAL, team.id),
  tournamentId: SEED_TOURNAMENT.GERAL,
  teamId: team.id,
  displayNameSnapshot: team.name,
  seed: null,
  tiebreakOrder: null,
  tiebreakBlockKey: null,
}))

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(GERAL_TEAMS)
  vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(GERAL_TOURNAMENT_TEAMS)
})

afterEach(() => {
  vi.restoreAllMocks()
})

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const demoView = async () => {
  const { result } = renderHook(() => useBracketView(1), { wrapper })
  await waitFor(() => expect(result.current.isPending).toBe(false))
  return result.current
}

describe('useBracketView', () => {
  it('returns the demo rounds in order', async () => {
    expect((await demoView()).rounds.map((round) => round.label)).toEqual(['Quartas de final', 'Semifinais', 'Final'])
  })

  it('attaches the linked match to each slot view', async () => {
    expect((await demoView()).slots.every((slot) => slot.match !== null)).toBe(true)
  })

  it('names each enrolled team for the side options', async () => {
    expect((await demoView()).teams).toHaveLength(16)
  })

  it('reports an error when the team catalog cannot load', async () => {
    vi.spyOn(sportsApi, 'getTeams').mockRejectedValueOnce(new Error('catalog unavailable'))
    const { result } = renderHook(() => useBracketView(1), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// The regression that protects the §3.4 seed reordering: it runs the real
// layout rule over the real seed. Revert the reordering and these two fail.
describe('the demo bracket', () => {
  it('lays out as a tree', async () => {
    const { rounds, slots } = await demoView()
    expect(bracketLayout(rounds, slots).mode).toBe('tree')
  })

  it('derives six edges', async () => {
    const { rounds, slots } = await demoView()
    expect(bracketLayout(rounds, slots).edges).toHaveLength(6)
  })
})
