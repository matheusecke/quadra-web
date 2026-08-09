import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamsTab } from './TeamsTab'
import * as sportsApi from '../../../services/sportsApi'
import type { Team, Tournament, TournamentTeam } from '../../../features/sports/types'

const tournament: Tournament = {
  id: 12,
  name: 'Intercursos 2026',
  seasonId: 7,
  categoryId: null,
  regulation: null,
  format: 'LEAGUE',
  status: 'IN_PROGRESS',
  startsAt: null,
  endsAt: null,
  registrationStartsAt: null,
  registrationEndsAt: null,
  isRegistrationOpen: false,
  championTournamentTeamId: null,
  enrolledTeamCount: 1,
  matchCount: 0,
  finishedMatchCount: 0,
  updatedAt: '2026-08-01T00:00:00.000Z',
}

const teams = new Map<number, Team>([[8, { id: 8, name: 'Engenharia PUC', shortName: 'EPU' }]])

const enrollment: TournamentTeam = {
  id: 41,
  tournamentId: 12,
  teamId: 8,
  displayNameSnapshot: 'Engenharia PUC',
  seed: null,
  tiebreakOrder: null,
  tiebreakBlockKey: null,
}

function renderTeamsTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TeamsTab tournament={tournament} teams={teams} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.restoreAllMocks())

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue([enrollment])
  vi.spyOn(sportsApi, 'listStandings').mockResolvedValue([])
})

describe('TeamsTab', () => {
  it('links a participant to its team profile', async () => {
    renderTeamsTab()

    const link = await screen.findByRole('link', { name: 'Engenharia PUC' })
    expect(link).toHaveAttribute('href', '/teams/8')
  })

  it('shows the catalog short name next to the participation snapshot', async () => {
    renderTeamsTab()

    expect(await screen.findByText('EPU')).toBeInTheDocument()
  })

  it('shows an empty state when the tournament has no participants', async () => {
    vi.mocked(sportsApi.getTournamentTeams).mockResolvedValueOnce([])

    renderTeamsTab()

    expect(await screen.findByText('Nenhuma equipe participante.')).toBeInTheDocument()
  })
})
