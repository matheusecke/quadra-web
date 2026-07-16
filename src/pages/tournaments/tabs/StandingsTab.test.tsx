import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StandingsTab } from './StandingsTab'
import * as sportsApi from '../../../services/sportsApi'
import { getTeams } from '../../../features/sports/mock-sports-data'
import { teamMap } from '../../../features/sports/sportsUtils'
import type { Tournament } from '../../../features/sports/types'

// useIsOrgAdmin reads from AuthContext, which this test does not mount.
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

describe('StandingsTab', () => {
  it('ranks the winner of a finished league match first', async () => {
    const tournament = await sportsApi.createTournament({
      name: 'Liga', seasonId: 'season-2025-26', categoryId: null, format: 'LEAGUE',
      startDate: '2026-02-01', endDate: '2026-06-01',
    })
    await sportsApi.enrollTeam({ tournamentId: tournament.id, teamId: 'puc-time-1', displayName: 'Alfa' })
    await sportsApi.enrollTeam({ tournamentId: tournament.id, teamId: 'puc-time-2', displayName: 'Beta' })
    const match = await sportsApi.scheduleMatch({
      tournamentId: tournament.id, homeTeamId: 'puc-time-2', awayTeamId: 'puc-time-1', scheduledAt: '2026-03-01T18:00',
    })
    await sportsApi.submitMatchResult({
      matchId: match.id,
      periods: [{ periodNumber: 1, type: 'REGULAR', overtimeNumber: null, homePoints: 60, awayPoints: 80 }],
      playerStats: [],
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <StandingsTab tournament={tournament as Tournament} teams={teamMap(getTeams())} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent(/time 1/i) // the winner, ranked by the data layer
  })
})
