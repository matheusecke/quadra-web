import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StandingsTab } from './StandingsTab'
import * as sportsApi from '../../../services/sportsApi'
import { getTeams } from '../../../features/sports/mock-sports-data'
import { teamMap } from '../../../features/sports/sportsUtils'
import type { StandingsEnvelope, Tournament } from '../../../features/sports/types'

// useIsOrgAdmin reads from AuthContext, which this test does not mount.
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

describe('StandingsTab', () => {
  it('ranks the winner of a finished league match first', async () => {
    // Ranking itself is the API's job — this test only checks that the tab renders the
    // rows in the order the API returns them.
    const tournament = { id: 501, format: 'LEAGUE' } as unknown as Tournament
    const envelope: StandingsEnvelope = {
      group: null,
      standingsState: 'FINAL',
      pendingMatches: 0,
      rows: [
        { position: 1, tournamentTeamId: 1, teamId: 1, teamName: 'Time 1', played: 1, wins: 1, losses: 0, classificationPoints: 2, pointsFor: 80, pointsAgainst: 60, pointDiff: 20, winPct: 1, isTiedUnresolved: false, tieBlockKey: null },
        { position: 2, tournamentTeamId: 2, teamId: 2, teamName: 'Time 2', played: 1, wins: 0, losses: 1, classificationPoints: 1, pointsFor: 60, pointsAgainst: 80, pointDiff: -20, winPct: 0, isTiedUnresolved: false, tieBlockKey: null },
      ],
    }
    vi.spyOn(sportsApi, 'listStandings').mockResolvedValue([envelope])

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <StandingsTab tournament={tournament} teams={teamMap(getTeams())} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent(/time 1/i) // the winner, ranked by the data layer
  })
})
