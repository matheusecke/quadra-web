import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AthleteDetailPage } from './AthleteDetailPage'
import * as sportsApi from '../../services/sportsApi'
import { getTeams as getMockTeams } from '../../features/sports/mock-sports-data'

const RAFAEL_ID = 165

const athlete = {
  id: RAFAEL_ID,
  name: 'Rafael Atual',
  currentTeamId: 8,
  jerseyNumber: 7,
  position: 'PG' as const,
  status: 'ACTIVE' as const,
}

const measuredGames = {
  minutesSeconds: 2, pts: 2, reb: 0, ast: 2, stl: 2, blk: 2, tov: 2, pf: 2,
  fgm: 2, fga: 2, threeFgm: 2, threeFga: 2, ftm: 2, fta: 2,
}

const totals = {
  minutesSeconds: 3600, pts: 0, reb: null, ast: 3, stl: 0, blk: 0, tov: 1, pf: 2,
  fgm: 8, fga: 6, threeFgm: 2, threeFga: 1, ftm: 4, fta: 3,
}

const statistics = {
  gamesPlayed: 3,
  measuredGames,
  totals,
  perGame: { ...totals, minutesSeconds: 1800, ast: 1.5, tov: 0.5, pf: 1 },
  shooting: { fgPct: 1.333, threeFgPct: 2, ftPct: 1.333, trueShootingPct: 1.4 },
  efficiency: { measuredGames: 2, total: 7, perGame: 3.5 },
}

const matchRow = {
  match: { id: 501, scheduledAt: '2026-08-15T19:30:00.000Z' },
  tournament: { id: 12, name: 'Historical Cup' },
  athleteName: 'Historical Athlete',
  team: { tournamentTeamId: 41, teamId: 8, name: 'Historical Team' },
  opponent: { tournamentTeamId: 52, teamId: 15, name: 'Historical Opponent' },
  result: { result: 'LOSS' as const, lossType: 'FORFEIT' as const, pointsFor: 0, pointsAgainst: 20 },
  stats: {
    tournamentRosterId: 88,
    minutesSeconds: null, pts: 0, reb: null, ast: 3, stl: 0, blk: 0, tov: 1, pf: 2,
    fgm: 8, fga: 6, threeFgm: 2, threeFga: 1, ftm: 4, fta: 3,
  },
  derived: { fgPct: 1.333, threeFgPct: 2, ftPct: 1.333, trueShootingPct: 1.4, efficiency: null },
}

const matchPage = (data: typeof matchRow[], currentPage = 1, totalPages = 1, totalItems = data.length) => ({
  data,
  meta: { totalItems, itemCount: data.length, itemsPerPage: 20, totalPages, currentPage },
  links: { first: '?page=1', previous: currentPage === 1 ? null : '?page=1', next: currentPage < totalPages ? '?page=2' : null, last: `?page=${totalPages}` },
  statusCode: 200,
})

const tournamentRow = {
  tournament: { id: 12, name: 'Historical Cup', seasonId: 7, startsAt: null },
  team: { tournamentTeamId: 41, teamId: 8, name: 'Snapshot Team' },
  statistics,
}

const tournamentPage = (
  data: typeof tournamentRow[],
  currentPage = 1,
  totalPages = 1,
  totalItems = data.length,
) => ({
  data,
  meta: { totalItems, itemCount: data.length, itemsPerPage: 20, totalPages, currentPage },
  links: { first: '?page=1', previous: currentPage === 1 ? null : '?page=1', next: currentPage < totalPages ? '?page=2' : null, last: `?page=${totalPages}` },
  statusCode: 200,
})

function renderAthletePage(athleteId = RAFAEL_ID) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/athletes/${athleteId}`]}>
        <Routes>
          <Route path="/athletes/:athleteId" element={<AthleteDetailPage />} />
          <Route path="/matches/:matchId" element={<div>Match destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function waitForAthletePage() {
  await screen.findByRole('heading', { name: /rafael atual/i })
}

afterEach(() => vi.restoreAllMocks())

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(getMockTeams())
  vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([
    { id: 1, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
  ])
  vi.spyOn(sportsApi, 'getAthlete').mockResolvedValue(athlete)
  vi.spyOn(sportsApi, 'getAthleteStatistics').mockResolvedValue(statistics)
  vi.spyOn(sportsApi, 'listAthleteMatchesPage').mockResolvedValue(matchPage([matchRow]))
  vi.spyOn(sportsApi, 'listAthleteTournamentsPage').mockResolvedValue(tournamentPage([tournamentRow]))
})

describe('AthleteDetailPage', () => {
  it('renders athlete header with jersey number, name, abbreviated position, current team and status only', async () => {
    renderAthletePage()

    await waitForAthletePage()

    const header = screen.getByTestId('athlete-header')
    expect(within(header).getByText('#7')).toBeInTheDocument()
    expect(within(header).getByRole('heading', { name: /rafael atual/i })).toBeInTheDocument()
    expect(within(header).getByText(/PG · Time 8/i)).toBeInTheDocument()
    expect(within(header).getByText('Ativo')).toBeInTheDocument()
    expect(within(header).queryByText(/organização/i)).not.toBeInTheDocument()
    expect(within(header).queryByText(/2026/i)).not.toBeInTheDocument()
  })

  it('renders a historical-only profile without fabricating current fields', async () => {
    vi.spyOn(sportsApi, 'getAthlete').mockResolvedValueOnce({
      ...athlete,
      currentTeamId: null,
      jerseyNumber: null,
      position: null,
      status: 'INACTIVE',
    })

    renderAthletePage()

    const header = await screen.findByTestId('athlete-header')
    expect(within(header).getByText('—')).toBeInTheDocument()
    expect(within(header).getByText('Não informada · Sem equipe atual')).toBeInTheDocument()
    expect(within(header).getByText('Inativo')).toBeInTheDocument()
  })

  it('shows only Resumo, Partidas and Campeonatos tabs and no eFG metric', async () => {
    renderAthletePage()

    await waitForAthletePage()

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Resumo',
      'Partidas',
      'Campeonatos',
    ])
    expect(screen.getByRole('heading', { name: 'Totais' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Médias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aproveitamento e eficiência' })).toBeInTheDocument()
    expect(screen.queryByText(/eFG/i)).not.toBeInTheDocument()
  })

  it('renders only server-owned Summary values with per-metric measurement counts', async () => {
    renderAthletePage()
    await waitForAthletePage()

    expect(screen.getByText('140%')).toBeInTheDocument()
    expect(screen.getByText('200%')).toBeInTheDocument()
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
    expect(screen.getByText('+7')).toBeInTheDocument()
    expect(screen.getByText('+3.5')).toBeInTheDocument()
    expect(screen.getByText('em 0 jogos medidos')).toBeInTheDocument()
    expect(screen.getAllByText('em 2 jogos medidos').length).toBeGreaterThan(1)
  })

  it('shows an empty Summary when the server reports zero aggregate games', async () => {
    vi.spyOn(sportsApi, 'getAthleteStatistics').mockResolvedValueOnce({
      ...statistics,
      gamesPlayed: 0,
    })
    renderAthletePage()

    expect(await screen.findByText('Sem estatísticas registradas.')).toBeInTheDocument()
  })

  it('keeps a statistics failure inside Summary and retries only that query', async () => {
    const getStatistics = vi
      .spyOn(sportsApi, 'getAthleteStatistics')
      .mockRejectedValueOnce(new Error('statistics unavailable'))
      .mockResolvedValueOnce(statistics)
    const user = userEvent.setup()
    renderAthletePage()

    expect(await screen.findByRole('heading', { name: /rafael atual/i })).toBeInTheDocument()
    expect(await screen.findByText('Não foi possível carregar as estatísticas.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('heading', { name: 'Totais' })).toBeInTheDocument()
    expect(getStatistics).toHaveBeenCalledTimes(2)
    expect(sportsApi.getAthlete).toHaveBeenCalledTimes(1)
  })

  it('renders the neutral not-found state for a profile 404', async () => {
    vi.spyOn(sportsApi, 'getAthlete').mockRejectedValueOnce(Object.assign(new Error('not found'), {
      isAxiosError: true,
      response: { status: 404 },
    }))
    renderAthletePage()
    expect(await screen.findByText('Atleta não encontrado.')).toBeInTheDocument()
  })

  it('does not request tournament history or seasons before Campeonatos opens', async () => {
    renderAthletePage()
    await waitForAthletePage()
    expect(sportsApi.listAthleteTournamentsPage).not.toHaveBeenCalled()
    expect(sportsApi.getSeasons).not.toHaveBeenCalled()
  })

  it('renders snapshot team, season fallback, server values and measured-game labels', async () => {
    vi.mocked(sportsApi.getSeasons).mockRejectedValueOnce(new Error('catalog unavailable'))
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))

    const row = await screen.findByRole('row', { name: /historical cup/i })
    expect(within(row).getByText('Snapshot Team')).toBeInTheDocument()
    expect(within(row).getByText('Temporada #7')).toBeInTheDocument()
    expect(within(row).getByText('140%')).toBeInTheDocument()
    expect(within(row).getByText('+3.5')).toBeInTheDocument()
    expect(within(row).getByText('em 0 jogos medidos')).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível carregar o atleta.')).not.toBeInTheDocument()
  })

  it('renders tournament seasons from the queried catalog', async () => {
    vi.mocked(sportsApi.getSeasons).mockResolvedValueOnce([
      { id: 7, label: 'Temporada via seam', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
    ])
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))
    expect(await screen.findByText('Temporada via seam')).toBeInTheDocument()
  })

  it('keeps transfer rows separate with stable tournament and enrollment identity', async () => {
    vi.mocked(sportsApi.listAthleteTournamentsPage).mockResolvedValueOnce(tournamentPage([
      tournamentRow,
      { ...tournamentRow, team: { tournamentTeamId: 42, teamId: 9, name: 'Second Snapshot Team' } },
    ]))
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))

    const tournamentLinks = await screen.findAllByRole('link', { name: 'Historical Cup' })
    expect(tournamentLinks).toHaveLength(2)
    expect(tournamentLinks.map((link) => link.getAttribute('href'))).toEqual(['/tournaments/12', '/tournaments/12'])
    expect(screen.getByText('Snapshot Team')).toBeInTheDocument()
    expect(screen.getByText('Second Snapshot Team')).toBeInTheDocument()
  })

  it('appends tournament pages and retries only the failed next page', async () => {
    vi.mocked(sportsApi.listAthleteTournamentsPage)
      .mockResolvedValueOnce(tournamentPage([tournamentRow], 1, 2, 2))
      .mockRejectedValueOnce(new Error('next page unavailable'))
      .mockResolvedValueOnce(tournamentPage([{ ...tournamentRow, tournament: { ...tournamentRow.tournament, id: 11, name: 'Older Cup' } }], 2, 2, 2))
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))
    await user.click(await screen.findByRole('button', { name: 'Carregar mais' }))

    expect(await screen.findByText('Não foi possível carregar mais campeonatos.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('2 campeonatos')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /cup/i }).map((link) => link.textContent))
      .toEqual(['Historical Cup', 'Older Cup'])
    expect(sportsApi.getAthlete).toHaveBeenCalledTimes(1)
  })

  it('retries a first-page tournament failure without refetching the profile', async () => {
    vi.mocked(sportsApi.listAthleteTournamentsPage)
      .mockRejectedValueOnce(new Error('history unavailable'))
      .mockResolvedValueOnce(tournamentPage([tournamentRow]))
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))

    expect(await screen.findByText('Não foi possível carregar os campeonatos.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Snapshot Team')).toBeInTheDocument()
    expect(sportsApi.listAthleteTournamentsPage).toHaveBeenCalledTimes(2)
    expect(sportsApi.getAthlete).toHaveBeenCalledTimes(1)
  })

  it('renders an athlete match using the scheduledAt slice', async () => {
    vi.mocked(sportsApi.listAthleteMatchesPage).mockResolvedValueOnce(
      matchPage([{ ...matchRow, match: { id: matchRow.match.id, scheduledAt: '2026-08-01T22:00:00.000Z' } }]),
    )
    const user = userEvent.setup()

    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.getByText('01/08/2026')).toBeInTheDocument()
  })

  it('does not request match history before the Matches tab opens', async () => {
    renderAthletePage()
    await waitForAthletePage()
    expect(sportsApi.listAthleteMatchesPage).not.toHaveBeenCalled()
  })

  it('renders historical snapshots, result metadata, null, zero and server-derived values', async () => {
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    const row = await screen.findByRole('row', { name: /historical cup/i })
    expect(within(row).getByText('Historical Athlete')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Historical Team × Historical Opponent' }))
      .toHaveAttribute('href', '/matches/501')
    expect(within(row).getByText('Derrota 0–20')).toBeInTheDocument()
    expect(within(row).getByText('W.O.')).toBeInTheDocument()
    expect(within(row).getByText('140%')).toBeInTheDocument()
    expect(within(row).getAllByText('N/A').length).toBeGreaterThan(0)
    expect(within(row).getAllByText('0').length).toBeGreaterThan(0)
  })

  it('uses only match metadata for its visible count even when Summary games differ', async () => {
    vi.mocked(sportsApi.listAthleteMatchesPage).mockResolvedValueOnce(matchPage([matchRow], 1, 1, 1))
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(await screen.findByText('1 partida')).toBeInTheDocument()
    expect(screen.queryByText(/diverg|inconsist|3 partidas/i)).not.toBeInTheDocument()
  })

  it('appends the next server page without changing row order', async () => {
    vi.mocked(sportsApi.listAthleteMatchesPage)
      .mockResolvedValueOnce(matchPage([matchRow], 1, 2, 2))
      .mockResolvedValueOnce(matchPage([{ ...matchRow, match: { ...matchRow.match, id: 500 }, tournament: { id: 11, name: 'Older Cup' } }], 2, 2, 2))
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))
    await user.click(await screen.findByRole('button', { name: 'Carregar mais' }))

    expect(screen.getAllByRole('link', { name: /historical team × historical opponent/i }).map((link) => link.getAttribute('href')))
      .toEqual(['/matches/501', '/matches/500'])
    expect(sportsApi.listAthleteMatchesPage).toHaveBeenLastCalledWith(RAFAEL_ID, { page: 2, limit: 20 })
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('keeps first-page and next-page retries inside Matches', async () => {
    vi.mocked(sportsApi.listAthleteMatchesPage)
      .mockRejectedValueOnce(new Error('first page unavailable'))
      .mockResolvedValueOnce(matchPage([matchRow], 1, 2, 2))
      .mockRejectedValueOnce(new Error('next page unavailable'))
      .mockResolvedValueOnce(matchPage([{ ...matchRow, match: { ...matchRow.match, id: 500 } }], 2, 2, 2))
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(await screen.findByText('Não foi possível carregar as partidas.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await user.click(await screen.findByRole('button', { name: 'Carregar mais' }))
    expect(await screen.findByText('Não foi possível carregar mais partidas.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('2 partidas')).toBeInTheDocument()
    expect(sportsApi.getAthlete).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('opens a match row with %s', async (_label, key) => {
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))
    const row = await screen.findByRole('row', { name: /historical cup/i })
    row.focus()
    await user.keyboard(key)
    expect(await screen.findByText('Match destination')).toBeInTheDocument()
  })
})
