import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTournamentById, getMatchesByTournament, getTeams } from '../../../features/sports/mock-sports-data'
import * as sportsApi from '../../../services/sportsApi'
import { tournamentTeamMap } from '../../../features/sports/sportsUtils'
import { OverviewTab } from './OverviewTab'
import type { StandingsEnvelope } from '../../../features/sports/types'

const { isOrgAdmin } = vi.hoisted(() => ({ isOrgAdmin: { value: false } }))
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => isOrgAdmin.value }))

const groupTable = (id: number, name: string): StandingsEnvelope => ({
  group: { id, name },
  standingsState: 'EMPTY',
  pendingMatches: 0,
  rows: [],
})

const renderGeral = (tournament = getTournamentById(1)!, onSeeBracket = vi.fn()) => {

  const teams = new Map(getTeams().map((team) => [team.id, team]))
  const matches = getMatchesByTournament(1)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <OverviewTab tournament={tournament} matches={matches} teams={teams} tournamentTeams={tournamentTeamMap([], teams)} onSeeBracket={onSeeBracket} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  isOrgAdmin.value = false
})

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

  it('shows the bracket section in a knockout', async () => {
    renderGeral({ ...getTournamentById(1)!, format: 'KNOCKOUT' })

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chaveamento' })).toBeInTheDocument())
  })

  it('shows the bracket section in a group stage followed by a knockout', async () => {
    renderGeral({ ...getTournamentById(1)!, format: 'GROUP_STAGE_KNOCKOUT' })

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chaveamento' })).toBeInTheDocument())
  })

  it('hides the bracket section in a league', () => {
    renderGeral({ ...getTournamentById(1)!, format: 'LEAGUE' })

    expect(screen.queryByRole('heading', { name: 'Chaveamento' })).not.toBeInTheDocument()
  })

  it('hides the bracket section in a group stage with no knockout', () => {
    renderGeral({ ...getTournamentById(1)!, format: 'GROUP_STAGE' })

    expect(screen.queryByRole('heading', { name: 'Chaveamento' })).not.toBeInTheDocument()
  })

  it('renders no bracket control that writes, even for an org admin', async () => {
    isOrgAdmin.value = true
    renderGeral({ ...getTournamentById(1)!, format: 'KNOCKOUT' })

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chaveamento' })).toBeInTheDocument())
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('shows one classification table per group the api returns', async () => {
    vi.spyOn(sportsApi, 'listStandings').mockResolvedValueOnce([groupTable(701, 'Grupo A'), groupTable(704, 'Grupo D')])
    renderGeral()

    await waitFor(() => expect(screen.getByText('Grupo A')).toBeInTheDocument())
    expect(screen.getByText('Grupo D')).toBeInTheDocument()
  })

  // A failed request must not read as "this tournament has no groups".
  it('says the classification failed to load instead of claiming there are no groups', async () => {
    vi.spyOn(sportsApi, 'listStandings').mockRejectedValueOnce(new Error('network down'))
    renderGeral()

    await waitFor(() => expect(screen.getByText(/não foi possível carregar a classificação/i)).toBeInTheDocument())
    expect(screen.queryByText(/grupos ainda não definidos/i)).not.toBeInTheDocument()
  })
})
