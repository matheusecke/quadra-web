import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as sportsApi from '../../services/sportsApi'
import { getTeams as getMockTeams, seedEnrollment } from '../../features/sports/mock-sports-data'
import { tournamentTeamId } from '../../features/sports/seedIds'
import { MatchesPage } from './MatchesPage'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

const ALL_TOURNAMENT_TEAMS = seedEnrollment.flatMap((entry) =>
  entry.teamIds.map((teamId) => ({
    id: tournamentTeamId(entry.tournamentId, teamId),
    tournamentId: entry.tournamentId,
    teamId,
    displayNameSnapshot: `Time ${teamId}`,
    seed: null,
    tiebreakOrder: null,
    tiebreakBlockKey: null,
  })),
)

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(getMockTeams())
  vi.spyOn(sportsApi, 'getAllTournamentTeams').mockResolvedValue(ALL_TOURNAMENT_TEAMS)
})

afterEach(() => vi.restoreAllMocks())

function renderMatchesPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchesPage', () => {
  it('shows a W.O. as finished and offers only lifecycle status filters', async () => {
    const user = userEvent.setup()
    renderMatchesPage()

    const score = await screen.findByText('20 – 0')
    const row = score.closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLTableRowElement).getByText('Finalizada')).toBeInTheDocument()
    expect(screen.queryByText(/aguardando estatísticas/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Filtrar por status' }))
    expect(screen.queryByRole('option', { name: /aguardando estatísticas/i })).not.toBeInTheDocument()
  })

  it('shows the enrolled teams\' own names, not "A definir", for a match with played teams', async () => {
    renderMatchesPage()

    const score = await screen.findByText('84 – 80')
    const row = score.closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLTableRowElement).getByText('Time 1')).toBeInTheDocument()
    expect(within(row as HTMLTableRowElement).getByText('Time 2')).toBeInTheDocument()
  })

  it('shows the page error state when the team catalog fails', async () => {
    vi.spyOn(sportsApi, 'getTeams').mockRejectedValueOnce(new Error('catalog unavailable'))
    renderMatchesPage()
    expect(await screen.findByText('Não foi possível carregar as partidas.')).toBeInTheDocument()
  })
})
