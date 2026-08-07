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

const measuredStatistics: TeamSummary['statistics'] = {
  results: {
    measuredGames: 18, winRate: 0.667, scoreMeasuredGames: 16,
    pointsForPerGame: 73.125, pointsAgainstPerGame: 68.5, pointDiffPerGame: 4.625,
  },
  boxScore: {
    measuredGames: { reb: 14, ast: 14, stl: 0, blk: 12, tov: 14, pf: 14 },
    perGame: { reb: 38.286, ast: 17.143, stl: null, blk: 3.25, tov: 11.786, pf: 16.214 },
    shooting: { fgPct: 0.481, threeFgPct: null, ftPct: 0.742, trueShootingPct: 0.571 },
    efficiency: { measuredGames: 12, perGame: 82.417 },
  },
}

const summary: TeamSummary = {
  team: { id: TEAM_ID, name: 'Engenharia PUC', shortName: 'EPU', city: 'Campinas', state: 'SP', status: 'ACTIVE' },
  titles: [],
  statistics: emptyStatistics,
}

const title = (id: number, name: string, seasonLabel: string) => ({
  tournament: { id, name, seasonId: 7, seasonLabel, startsAt: null, endsAt: null },
})

const fourTitles = [
  title(14, 'Intercursos 2028', '2028'),
  title(13, 'Intercursos 2027', '2027'),
  title(12, 'Intercursos 2026', '2026'),
  title(11, 'Intercursos 2025', '2025'),
]

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

  it('shows the empty gallery message when the team has no titles', async () => {
    renderTeamPage()

    await waitForTeamPage()

    expect(screen.getByText('Nenhum título conquistado.')).toBeInTheDocument()
  })

  it('offers no expand control when the team has no titles', async () => {
    renderTeamPage()

    await waitForTeamPage()

    expect(screen.queryByRole('button', { name: 'Ver todos' })).not.toBeInTheDocument()
  })

  it('renders at most three titles before expanding', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, titles: fourTitles })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('keeps the oldest title hidden until the gallery expands', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, titles: fourTitles })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.queryByText('Intercursos 2025')).not.toBeInTheDocument()
  })

  it('offers no expand control with exactly three titles', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({
      ...summary,
      titles: fourTitles.slice(0, 3),
    })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.queryByRole('button', { name: 'Ver todos' })).not.toBeInTheDocument()
  })

  it('reports the collapsed gallery state to assistive technology', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, titles: fourTitles })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.getByRole('button', { name: 'Ver todos' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands the full title list inline', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, titles: fourTitles })
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()

    await user.click(screen.getByRole('button', { name: 'Ver todos' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('expands the gallery without a second summary request', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValue({ ...summary, titles: fourTitles })
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()

    await user.click(screen.getByRole('button', { name: 'Ver todos' }))

    expect(sportsApi.getTeamSummary).toHaveBeenCalledTimes(1)
  })

  it('collapses the gallery back to three titles', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, titles: fourTitles })
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('button', { name: 'Ver todos' }))

    await user.click(screen.getByRole('button', { name: 'Mostrar menos' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('reports the expanded gallery state to assistive technology', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, titles: fourTitles })
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()

    await user.click(screen.getByRole('button', { name: 'Ver todos' }))

    expect(screen.getByRole('button', { name: 'Mostrar menos' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders each title with its tournament and season', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, titles: fourTitles })

    renderTeamPage()

    await waitForTeamPage()
    const entry = within(screen.getAllByRole('listitem')[0])
    expect(entry.getByText('Intercursos 2028')).toBeInTheDocument()
  })

  it('opens on the overview tab', async () => {
    renderTeamPage()

    await waitForTeamPage()

    expect(screen.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders the win rate as a percentage in the results group', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, statistics: measuredStatistics })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.getByText('66.7%')).toBeInTheDocument()
  })

  it('annotates the win rate with its measured-game denominator', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, statistics: measuredStatistics })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.getByText('em 18 jogos medidos')).toBeInTheDocument()
  })

  it('signs the official point differential per game', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, statistics: measuredStatistics })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.getByText('+4.625')).toBeInTheDocument()
  })

  it('renders an unmeasured production metric as an em dash', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, statistics: measuredStatistics })

    renderTeamPage()

    await waitForTeamPage()
    const strip = screen.getByTestId('overview-production')
    expect(within(strip).getAllByText('—').length).toBeGreaterThan(0)
  })

  it('keeps a measured zero denominator visible for an unmeasured metric', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, statistics: measuredStatistics })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.getByText('em 0 jogos medidos')).toBeInTheDocument()
  })

  it('never renders an aggregate totals group', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, statistics: measuredStatistics })

    renderTeamPage()

    await waitForTeamPage()
    expect(screen.queryByRole('heading', { name: 'Totais' })).not.toBeInTheDocument()
  })

  it('reports an entirely unmeasured results group as having no statistics', async () => {
    renderTeamPage()

    await waitForTeamPage()

    const group = screen.getByTestId('overview-results')
    expect(within(group).getByText('Sem estatísticas registradas.')).toBeInTheDocument()
  })

  it('reports an entirely unmeasured production group as having no statistics', async () => {
    renderTeamPage()

    await waitForTeamPage()

    const group = screen.getByTestId('overview-production')
    expect(within(group).getByText('Sem estatísticas registradas.')).toBeInTheDocument()
  })

  it('renders the overview without any extra request beyond the summary', async () => {
    vi.mocked(sportsApi.getTeamSummary).mockResolvedValueOnce({ ...summary, statistics: measuredStatistics })

    renderTeamPage()

    await waitForTeamPage()
    expect(sportsApi.getTeamSummary).toHaveBeenCalledTimes(1)
  })
})
