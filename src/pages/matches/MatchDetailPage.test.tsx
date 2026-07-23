import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MatchDetailPage } from './MatchDetailPage'
import * as sportsApi from '../../services/sportsApi'
import type { TournamentTeam } from '../../features/sports/types'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

// GERAL tournament (id 1) enrollment snapshot naming Time 1 "Titans FC" — proves the score hero
// resolves via the enrollment snapshot, not a live re-lookup in the global team catalog.
vi.mock('../../features/sports/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/sports/queries')>()
  const renamedGeralTeams: TournamentTeam[] = [
    { id: 1001, tournamentId: 1, teamId: 1, displayNameSnapshot: 'Titans FC', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
    { id: 1002, tournamentId: 1, teamId: 2, displayNameSnapshot: 'Time 2', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
  ]
  return {
    ...actual,
    useTournamentTeamsQuery: (tournamentId: number | undefined) => {
      const real = actual.useTournamentTeamsQuery(tournamentId)
      return tournamentId === 1 ? { ...real, data: renamedGeralTeams } : real
    },
  }
})

const renderDetail = (matchId: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/matches/${matchId}`]}>
        <Routes>
          <Route path="/matches/:matchId" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchDetailPage', () => {
  it('explains an awarded score on a freshly loaded page, not just after submitting', async () => {
    renderDetail('217')
    expect(await screen.findByText(/placar atribuído por abandono/i)).toBeInTheDocument()
  })

  it('marks a W.O. and does not show an empty súmula as if it were missing data', async () => {
    renderDetail('218')
    expect(await screen.findByText(/vitória por w\.o\./i)).toBeInTheDocument()
    expect(await screen.findByText('Finalizada')).toBeInTheDocument()
    expect(screen.queryByText(/aguardando estatísticas/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/placar por período/i)).not.toBeInTheDocument()
    expect(screen.getByText(/partida não disputada\. não há súmula/i)).toBeInTheDocument()
  })

  it('renders stored playing time as MM:SS in the stats tab', async () => {
    const user = userEvent.setup()
    renderDetail('131')

    await user.click(await screen.findByRole('tab', { name: 'Estatísticas' }))
    const player = await screen.findByRole('link', { name: 'Rafael Moura' })
    const row = player.closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLTableRowElement).getByText('38:00')).toBeInTheDocument()
  })

  it('labels box score turnovers as TOV', async () => {
    const user = userEvent.setup()
    renderDetail('131')

    await user.click(await screen.findByRole('tab', { name: 'Estatísticas' }))

    expect(await screen.findByRole('columnheader', { name: 'TOV' })).toBeInTheDocument()
  })

  it('sends the back button to the championship matches list, not the global one', async () => {
    renderDetail('131')

    await screen.findByText('Mandante')
    const back = screen.getByRole('link', { name: 'Partidas' })
    expect(back).toHaveAttribute('href', '/tournaments/1?tab=matches')
  })

  it('shows the enrollment snapshot name in the score hero, not the live global team name', async () => {
    renderDetail('131')

    expect((await screen.findAllByText('Titans FC')).length).toBeGreaterThan(0)
  })

  it('resolves the MVP from the queried athlete catalog', async () => {
    const athletes = await sportsApi.getAthletes()
    vi.spyOn(sportsApi, 'getAthletes').mockResolvedValueOnce(
      athletes.map((athlete) => athlete.id === 101 ? { ...athlete, name: 'MVP via seam' } : athlete),
    )
    renderDetail('131')
    expect(await screen.findByText('MVP via seam')).toBeInTheDocument()
  })
})
