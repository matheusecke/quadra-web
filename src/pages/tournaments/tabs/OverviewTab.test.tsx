import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { getTournamentById, getMatchesByTournament, getTeams } from '../../../features/sports/mock-sports-data'
import { OverviewTab } from './OverviewTab'

const renderGeral = () => {
  const tournament = getTournamentById('puc-geral-2026')
  expect(tournament).toBeDefined()

  const teams = new Map(getTeams().map((team) => [team.id, team]))
  const matches = getMatchesByTournament('puc-geral-2026')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <OverviewTab tournament={tournament!} matches={matches} teams={teams} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('OverviewTab', () => {
  it('renders overview sections in the required order', () => {
    renderGeral()

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Grupos',
      'Chaveamento',
      'Líderes',
      'Partidas',
      'Regulamento',
    ])
  })

  it('shows one classification table per group, derived from the matches', async () => {
    renderGeral()

    await waitFor(() => expect(screen.getByText('Grupo A')).toBeInTheDocument())
    expect(screen.getByText('Grupo D')).toBeInTheDocument()
  })
})
