import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamDetailPage } from './TeamDetailPage'
import * as sportsApi from '../../services/sportsApi'
import type { TeamSummary } from '../../features/sports/types'

const TEAM_ID = 8

const emptyStatistics: TeamSummary['statistics'] = {
  results: {
    measuredGames: 0, winRate: null, scoreMeasuredGames: 0,
    pointsForPerGame: null, pointsAgainstPerGame: null, pointDiffPerGame: null,
  },
  boxScore: {
    measuredGames: { reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 },
    perGame: { reb: null, ast: null, stl: null, blk: null, tov: null, pf: null },
    shooting: { fgPct: null, threeFgPct: null, ftPct: null, trueShootingPct: null },
    efficiency: { measuredGames: 0, perGame: null },
  },
}

const summary: TeamSummary = {
  team: { id: TEAM_ID, name: 'Engenharia PUC', shortName: 'EPU', city: 'Campinas', state: 'SP', status: 'ACTIVE' },
  titles: [],
  statistics: emptyStatistics,
}

function renderTeamPage(teamId: number | string = TEAM_ID) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/teams/${teamId}`]}>
        <Routes>
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          <Route path="/matches/:matchId" element={<div>Match destination</div>} />
          <Route path="/athletes/:athleteId" element={<div>Athlete destination</div>} />
          <Route path="/tournaments/:tournamentId" element={<div>Tournament destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function waitForTeamPage() {
  await screen.findByRole('heading', { name: /engenharia puc/i })
}

afterEach(() => vi.restoreAllMocks())

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeamSummary').mockResolvedValue(summary)
})

describe('TeamDetailPage', () => {
  it('shows an invalid ID error for a non-numeric team route param', () => {
    renderTeamPage('abc')

    expect(screen.getByText('ID de equipe inválido.')).toBeInTheDocument()
  })

  it('does not call the API for an invalid team route param', () => {
    renderTeamPage('abc')

    expect(sportsApi.getTeamSummary).not.toHaveBeenCalled()
  })

  it('shows a profile skeleton before the summary request settles', () => {
    vi.mocked(sportsApi.getTeamSummary).mockReturnValueOnce(new Promise(() => undefined))

    renderTeamPage()

    expect(screen.queryByTestId('team-header')).not.toBeInTheDocument()
  })

  it('renders the short name tile, team name, location and contextual status', async () => {
    renderTeamPage()

    await waitForTeamPage()

    const header = screen.getByTestId('team-header')
    expect(within(header).getByText('EPU')).toBeInTheDocument()
    expect(within(header).getByText('Campinas / SP')).toBeInTheDocument()
    expect(within(header).getByText('Ativa')).toBeInTheDocument()
  })

  it('renders the historical contextual status without inventing an affiliation', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({
      ...summary,
      team: { ...summary.team, city: null, state: null, status: 'HISTORICAL' },
    })

    renderTeamPage()

    const header = await screen.findByTestId('team-header')
    expect(within(header).getByText('Histórica')).toBeInTheDocument()
  })

  it('renders an em dash when neither city nor state is recorded', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({
      ...summary,
      team: { ...summary.team, city: null, state: null, status: 'INACTIVE' },
    })

    renderTeamPage()

    const header = await screen.findByTestId('team-header')
    expect(within(header).getByText('—')).toBeInTheDocument()
  })

  it('renders the neutral not-found state for a summary 404', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockRejectedValueOnce(Object.assign(new Error('not found'), {
      isAxiosError: true,
      response: { status: 404 },
    }))

    renderTeamPage()

    expect(await screen.findByText('Equipe não encontrada.')).toBeInTheDocument()
  })

  it('recovers a failed summary through the local retry action', async () => {
    vi.mocked(sportsApi.getTeamSummary)
      .mockRejectedValueOnce(new Error('summary unavailable'))
      .mockResolvedValueOnce(summary)
    const user = userEvent.setup()
    renderTeamPage()

    expect(await screen.findByText('Não foi possível carregar a equipe.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByTestId('team-header')).toBeInTheDocument()
  })
})
