import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import * as sportsApi from '../../services/sportsApi'
import {
  useAddRosterEntry,
  useCreateTournament,
  useEnrollTeam,
  useRemoveRosterEntry,
  useRosterQuery,
  useUpdateRosterEntry,
} from './queries'
import type { Tournament, TournamentTeam } from './types'

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

describe('roster mutation hooks', () => {
  it('updates and removes an entry, invalidating the active roster query after each mutation', async () => {
    // Roster entries live in the mock store, which never validates that the tournamentId
    // it is handed actually exists — so the tournament and its enrollment can be stubbed at
    // the sportsApi boundary and only the roster CRUD itself exercises the real store.
    vi.spyOn(sportsApi, 'createTournament').mockResolvedValue({ id: 503 } as Tournament)
    vi.spyOn(sportsApi, 'enrollTeam').mockResolvedValue({
      id: 601, tournamentId: 503, teamId: 1, displayNameSnapshot: 'Tigres',
      seed: null, tiebreakOrder: null, tiebreakBlockKey: null,
    } as TournamentTeam)
    const tournament = await renderHook(() => useCreateTournament(), { wrapper }).result.current.mutateAsync({
      name: 'Copa R',
      seasonId: 1,
      format: 'LEAGUE',
    })
    const enrollment = await renderHook(() => useEnrollTeam(), { wrapper }).result.current.mutateAsync({
      tournamentId: tournament.id,
      teamId: 1,
      displayName: 'Tigres',
    })
    const entry = await renderHook(() => useAddRosterEntry(), { wrapper }).result.current.mutateAsync({
      tournamentId: tournament.id,
      tournamentTeamId: enrollment.id,
      athleteId: 109,
      jerseyNumber: 7,
      role: 'ATHLETE',
    })
    const list = renderHook(() => useRosterQuery(tournament.id, enrollment.id), { wrapper })
    await waitFor(() => expect(list.result.current.data?.[0]?.jerseyNumber).toBe(7))

    await renderHook(() => useUpdateRosterEntry(), { wrapper }).result.current.mutateAsync({
      id: entry.id,
      tournamentId: tournament.id,
      tournamentTeamId: enrollment.id,
      input: { jerseyNumber: 23 },
    })
    await waitFor(() => expect(list.result.current.data?.[0]?.jerseyNumber).toBe(23))

    await renderHook(() => useRemoveRosterEntry(), { wrapper }).result.current.mutateAsync({
      id: entry.id,
      tournamentId: tournament.id,
      tournamentTeamId: enrollment.id,
    })
    await waitFor(() => expect(list.result.current.data?.length).toBe(0))
  })
})
