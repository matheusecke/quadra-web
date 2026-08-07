import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamDetailPage } from './TeamDetailPage'
import * as sportsApi from '../../services/sportsApi'
import type { TeamSummary } from '../../features/sports/types'
import type { PaginatedResponse } from '../../types/admin'

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

const upcomingRow = {
  match: {
    id: 601, status: 'SCHEDULED' as const, scheduledAt: '2026-09-10T22:00:00.000Z',
    venueName: null, scoreSource: null,
  },
  tournament: { id: 12, name: 'Intercursos 2026', seasonId: 7, seasonLabel: '2026' },
  team: {
    tournamentTeamId: 41, teamId: TEAM_ID, name: 'Engenharia PUC',
    score: null, result: null, lossType: null, isWinner: null,
  },
  opponent: {
    tournamentTeamId: 43, teamId: 10, name: 'Medicina PUC',
    score: null, result: null, lossType: null, isWinner: null,
  },
}

const historyRow = {
  match: {
    id: 501, status: 'FINISHED' as const, scheduledAt: '2026-08-15T22:30:00.000Z',
    venueName: 'Ginásio Central', scoreSource: 'PERIODS' as const,
  },
  tournament: { id: 12, name: 'Intercursos 2026', seasonId: 7, seasonLabel: '2026' },
  team: {
    tournamentTeamId: 41, teamId: TEAM_ID, name: 'Engenharia PUC',
    score: 78, result: 'WIN' as const, lossType: null, isWinner: true,
  },
  opponent: {
    tournamentTeamId: 42, teamId: 9, name: 'Direito PUC',
    score: 72, result: 'LOSS' as const, lossType: 'FORFEIT' as const, isWinner: false,
  },
}

/** Shared page-envelope builder, reused by the tournament and roster tests. */
const matchPage = <T,>(data: T[], currentPage = 1, totalPages = 1): PaginatedResponse<T> => ({
  data,
  meta: { totalItems: data.length * totalPages, itemCount: data.length, itemsPerPage: 20, totalPages, currentPage },
  links: {
    first: '?page=1',
    previous: currentPage === 1 ? null : '?page=1',
    next: currentPage < totalPages ? '?page=2' : null,
    last: `?page=${totalPages}`,
  },
  statusCode: 200,
})

const matchesByScope = (upcoming: typeof upcomingRow[], history: typeof historyRow[]) =>
  vi.mocked(sportsApi.listTeamMatchesPage).mockImplementation(async (_id, params) =>
    params.scope === 'upcoming' ? matchPage(upcoming) : matchPage(history))

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
  vi.spyOn(sportsApi, 'listTeamMatchesPage').mockResolvedValue(matchPage([]))
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

  it('does not request matches before the Partidas tab opens', async () => {
    renderTeamPage()

    await waitForTeamPage()

    expect(sportsApi.listTeamMatchesPage).not.toHaveBeenCalled()
  })

  it('requests both match scopes when the Partidas tab opens', async () => {
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()

    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    await waitFor(() => expect(sportsApi.listTeamMatchesPage).toHaveBeenCalledTimes(2))
  })

  it('renders an upcoming match with its tournament and schedule', async () => {
    matchesByScope([upcomingRow], [])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-upcoming')
    expect(within(section).getByText('Intercursos 2026')).toBeInTheDocument()
  })

  it('links only the opponent of an upcoming match to its team profile', async () => {
    matchesByScope([upcomingRow], [])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-upcoming')
    expect(within(section).getByRole('link', { name: 'Medicina PUC' })).toHaveAttribute('href', '/teams/10')
  })

  it('renders an em dash for an unscheduled venue', async () => {
    matchesByScope([upcomingRow], [])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-upcoming')
    expect(within(section).getAllByText('—').length).toBeGreaterThan(0)
  })

  it('keeps the result masked for a match that has not finished', async () => {
    matchesByScope([upcomingRow], [])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-upcoming')
    expect(within(section).queryByText(/Vitória|Derrota/)).not.toBeInTheDocument()
  })

  it('renders the finished result with the official score', async () => {
    matchesByScope([], [historyRow])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-history')
    expect(within(section).getByText('Vitória 78–72')).toBeInTheDocument()
  })

  it('flags a forfeited match in the history row', async () => {
    matchesByScope([], [historyRow])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-history')
    expect(within(section).getByText('W.O.')).toBeInTheDocument()
  })

  it('links a history row to its match detail', async () => {
    matchesByScope([], [historyRow])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-history')
    expect(within(section).getByRole('link', { name: /15 de ago/i })).toHaveAttribute('href', '/matches/501')
  })

  it('shows a scope-specific empty state for upcoming matches', async () => {
    matchesByScope([], [historyRow])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(await screen.findByText('Nenhuma partida agendada.')).toBeInTheDocument()
  })

  it('shows a scope-specific empty state for the match history', async () => {
    matchesByScope([upcomingRow], [])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(await screen.findByText('Nenhuma partida no histórico.')).toBeInTheDocument()
  })

  it('keeps the history section readable when the upcoming section fails', async () => {
    vi.mocked(sportsApi.listTeamMatchesPage).mockImplementation(async (_id, params) => {
      if (params.scope === 'upcoming') throw new Error('upcoming unavailable')
      return matchPage([historyRow])
    })
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const section = await screen.findByTestId('matches-history')
    expect(within(section).getByText('Vitória 78–72')).toBeInTheDocument()
  })

  it('retries only the failed match scope', async () => {
    const listMatches = vi.mocked(sportsApi.listTeamMatchesPage)
    listMatches.mockImplementation(async (_id, params) => {
      if (params.scope === 'history') return matchPage([])
      throw new Error('upcoming unavailable')
    })
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))
    await screen.findByText('Não foi possível carregar as próximas partidas.')
    listMatches.mockImplementation(async () => matchPage([upcomingRow]))

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Medicina PUC')).toBeInTheDocument()
  })

  it('appends the next history page on demand', async () => {
    const older = { ...historyRow, match: { ...historyRow.match, id: 500 }, opponent: { ...historyRow.opponent, name: 'Arquitetura PUC' } }
    const listMatches = vi.mocked(sportsApi.listTeamMatchesPage)
    listMatches.mockImplementation(async (_id, params) =>
      params.scope === 'upcoming' ? matchPage([]) : matchPage([historyRow], 1, 2))
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))
    await screen.findByText('Vitória 78–72')
    listMatches.mockImplementation(async () => matchPage([older], 2, 2))

    await user.click(screen.getByRole('button', { name: 'Carregar mais' }))

    expect(await screen.findByText('Arquitetura PUC')).toBeInTheDocument()
  })

  it('hides the load-more control on the last history page', async () => {
    matchesByScope([], [historyRow])
    const user = userEvent.setup()
    renderTeamPage()
    await waitForTeamPage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))
    await screen.findByText('Vitória 78–72')

    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })
})
