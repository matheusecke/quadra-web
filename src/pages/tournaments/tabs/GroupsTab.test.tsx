import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GroupsTab } from './GroupsTab'
import * as sportsApi from '../../../services/sportsApi'
import { getTeams } from '../../../features/sports/mock-sports-data'
import { teamMap } from '../../../features/sports/sportsUtils'
import type { Tournament } from '../../../features/sports/types'

// useIsOrgAdmin reads from AuthContext, which no test here provides — mocked the same way
// TournamentDetailPage.test.tsx does.
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

const tournament = { id: 'tt', name: 'Copa', format: 'GROUP_STAGE', teamIds: [] } as unknown as Tournament

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
    const team = getTeams()[0]
    const tournament = await sportsApi.createTournament({
      name: 'Copa das Estrelas',
      seasonId: 'season-2025-26',
      categoryId: null,
      format: 'GROUP_STAGE',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
    })
    await sportsApi.enrollTeam({ tournamentId: tournament.id, teamId: team.id, displayName: team.name })
    const group = await sportsApi.createGroup({ tournamentId: tournament.id, name: 'Grupo A' })
    await sportsApi.assignTeamToGroup({ tournamentId: tournament.id, groupId: group.id, teamId: team.id })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <GroupsTab tournament={tournament} teams={teamMap(getTeams())} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Grupo A' })).toBeInTheDocument())
    expect(screen.getByText(team.name)).toBeInTheDocument()
  })
})
