import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as sportsApi from '../../services/sportsApi'
import { bracketLayout } from './bracketLayout'
import { useBracketView } from './useBracketView'
import { SEED_TOURNAMENT, tournamentTeamId } from './seedIds'
import type { BracketSlotTeam, BracketSlotView, Team, TournamentTeam } from './types'

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

/** Same tree the mock seed used to describe as a store: 4 quarters -> 2 semis -> 1 final. */
const teamRef = (n: number): BracketSlotTeam => {
  const team = GERAL_TEAMS[n - 1]
  return { tournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.GERAL, n), name: team.name, shortName: team.shortName }
}

const DEMO_BRACKET: sportsApi.BracketRead = {
  rounds: [
    { id: 1, tournamentId: SEED_TOURNAMENT.GERAL, number: 1, label: 'Quartas de final' },
    { id: 2, tournamentId: SEED_TOURNAMENT.GERAL, number: 2, label: 'Semifinais' },
    { id: 3, tournamentId: SEED_TOURNAMENT.GERAL, number: 3, label: 'Final' },
  ],
  slots: [
    { id: 1, roundId: 1, position: 1, label: null, homeTeam: teamRef(1), awayTeam: teamRef(5), match: null, winnerTournamentTeamId: teamRef(1).tournamentTeamId },
    { id: 2, roundId: 1, position: 2, label: null, homeTeam: teamRef(13), awayTeam: teamRef(10), match: null, winnerTournamentTeamId: teamRef(13).tournamentTeamId },
    { id: 3, roundId: 1, position: 3, label: null, homeTeam: teamRef(6), awayTeam: teamRef(2), match: null, winnerTournamentTeamId: teamRef(2).tournamentTeamId },
    { id: 4, roundId: 1, position: 4, label: null, homeTeam: teamRef(9), awayTeam: teamRef(14), match: null, winnerTournamentTeamId: teamRef(9).tournamentTeamId },
    { id: 5, roundId: 2, position: 1, label: null, homeTeam: teamRef(1), awayTeam: teamRef(13), match: null, winnerTournamentTeamId: teamRef(1).tournamentTeamId },
    { id: 6, roundId: 2, position: 2, label: null, homeTeam: teamRef(2), awayTeam: teamRef(9), match: null, winnerTournamentTeamId: teamRef(2).tournamentTeamId },
    { id: 7, roundId: 3, position: 1, label: null, homeTeam: teamRef(1), awayTeam: teamRef(2), match: null, winnerTournamentTeamId: teamRef(1).tournamentTeamId },
  ],
}

const toLayoutSlots = (slots: BracketSlotView[]) => slots.map((slot) => ({
  id: slot.id,
  roundId: slot.roundId,
  position: slot.position,
  homeTournamentTeamId: slot.homeTeam?.tournamentTeamId ?? null,
  awayTournamentTeamId: slot.awayTeam?.tournamentTeamId ?? null,
  winnerTournamentTeamId: slot.winnerTournamentTeamId,
}))

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(GERAL_TEAMS)
  vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(GERAL_TOURNAMENT_TEAMS)
  vi.spyOn(sportsApi, 'getBracket').mockImplementation(async (id) =>
    id === SEED_TOURNAMENT.GERAL ? DEMO_BRACKET : { rounds: [], slots: [] })
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

  it('names each enrolled team for the side options', async () => {
    expect((await demoView()).teams).toHaveLength(16)
  })

  it('uses the enrollment snapshot when the current team was renamed', async () => {
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValueOnce([
      { ...GERAL_TOURNAMENT_TEAMS[0], displayNameSnapshot: 'Nome histórico' },
    ])
    expect((await demoView()).teams[0].name).toBe('Nome histórico')
  })

  // The team catalogue is a display concern for the picker, not the board itself.
  it('keeps the bracket readable when the team catalog fails to load', async () => {
    vi.spyOn(sportsApi, 'getTeams').mockRejectedValueOnce(new Error('catalog unavailable'))
    expect((await demoView()).isError).toBe(false)
  })

  it('reports an error when the bracket itself fails to load', async () => {
    vi.spyOn(sportsApi, 'getBracket').mockRejectedValueOnce(new Error('bracket unavailable'))
    const { result } = renderHook(() => useBracketView(1), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// The regression that protects the §3.4 seed reordering: it runs the real
// layout rule over the real seed. Revert the reordering and these two fail.
describe('the demo bracket', () => {
  it('lays out as a tree', async () => {
    const { rounds, slots } = await demoView()
    expect(bracketLayout(rounds, toLayoutSlots(slots)).mode).toBe('tree')
  })

  it('derives six edges', async () => {
    const { rounds, slots } = await demoView()
    expect(bracketLayout(rounds, toLayoutSlots(slots)).edges).toHaveLength(6)
  })
})
