import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GroupsTab } from './GroupsTab'
import * as sportsApi from '../../../services/sportsApi'
import { teamMap } from '../../../features/sports/sportsUtils'
import type { StandingsEnvelope, Team, Tournament } from '../../../features/sports/types'

// useIsOrgAdmin reads from AuthContext, which no test here provides — mocked the same way
// TournamentDetailPage.test.tsx does.
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

const tournament = { id: 999, name: 'Copa', format: 'GROUP_STAGE', teamIds: [] } as unknown as Tournament

const renderTab = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <GroupsTab tournament={tournament} teams={new Map()} />
    </QueryClientProvider>,
  )
}

describe('GroupsTab', () => {
  it('shows an empty state when the tournament has no groups yet', async () => {
    renderTab()
    await waitFor(() => expect(screen.getByText(/nenhum grupo criado ainda/i)).toBeInTheDocument())
  })

  it('renders one StandingsCard per envelope for a tournament that has groups', async () => {
    // A fresh id kept off the real API: this test only exercises GroupsTab's own rendering
    // of whatever the group/standings queries resolve with, mocked at the sportsApi boundary.
    const team: Team = { id: 501, name: 'Equipe de Teste', shortName: 'EQT' }
    const fakeTournament = { id: 501, format: 'GROUP_STAGE' } as unknown as Tournament
    const groupA = { id: 701, tournamentId: fakeTournament.id, name: 'Grupo A', sortOrder: 1 }
    const enrollment = {
      id: 801, tournamentId: fakeTournament.id, teamId: team.id, displayNameSnapshot: team.name,
      seed: null, tiebreakOrder: null, tiebreakBlockKey: null,
    }
    const envelope: StandingsEnvelope = {
      group: { id: groupA.id, name: groupA.name },
      standingsState: 'EMPTY',
      pendingMatches: 0,
      rows: [{
        position: null, tournamentTeamId: enrollment.id, teamId: team.id, teamName: team.name,
        played: 0, wins: 0, losses: 0, classificationPoints: 0, pointsFor: 0, pointsAgainst: 0,
        pointDiff: 0, winPct: null, isTiedUnresolved: false, tieBlockKey: null,
      }],
    }

    vi.spyOn(sportsApi, 'getGroups').mockResolvedValue([groupA])
    vi.spyOn(sportsApi, 'getGroupTeams').mockResolvedValue([
      { id: 901, tournamentId: fakeTournament.id, groupId: groupA.id, tournamentTeamId: enrollment.id },
    ])
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue([enrollment])
    vi.spyOn(sportsApi, 'listStandings').mockImplementation((() => Promise.resolve([envelope])) as unknown as typeof sportsApi.listStandings)

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <GroupsTab tournament={fakeTournament} teams={teamMap([team])} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Grupo A' })).toBeInTheDocument())
    expect(screen.getByText(team.name)).toBeInTheDocument()
  })
})
