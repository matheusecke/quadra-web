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

function renderAthletePage(athleteId = RAFAEL_ID) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/athletes/${athleteId}`]}>
        <Routes>
          <Route path="/athletes/:athleteId" element={<AthleteDetailPage />} />
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

  it('shows full matchup rows in Partidas and links rows to match details without an opponent column', async () => {
    const user = userEvent.setup()
    renderAthletePage(101)

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.queryByRole('columnheader', { name: /adversário/i })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /partida/i })).toBeInTheDocument()
    const finalLink = screen.getAllByRole('link', { name: /time 1 × time 2/i }).find(
      (link) => link.getAttribute('href') === '/matches/131',
    )
    expect(finalLink).toBeDefined()
    const finalRow = finalLink?.closest('tr')
    expect(finalRow).not.toBeNull()
    expect(within(finalRow as HTMLTableRowElement).getByText('38:00')).toBeInTheDocument()
  })

  it('labels match turnovers as TOV', async () => {
    const user = userEvent.setup()
    renderAthletePage(101)

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.getByRole('columnheader', { name: 'TOV' })).toBeInTheDocument()
  })

  it('shows team context in Campeonatos and links rows to tournament details', async () => {
    const user = userEvent.setup()
    renderAthletePage(101)

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))

    expect(screen.getByRole('columnheader', { name: /equipe/i })).toBeInTheDocument()
    expect(screen.getByText('Time 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /campeonato geral da puc 2026/i })).toHaveAttribute(
      'href',
      '/tournaments/1',
    )
  })

  it('shows the enrollment snapshot team name in Campeonatos, not a live catalog lookup', async () => {
    const user = userEvent.setup()
    const rows = await sportsApi.getAthleteTournamentStats(RAFAEL_ID)
    vi.spyOn(sportsApi, 'getAthleteTournamentStats').mockResolvedValue(
      rows.map((row) => ({ ...row, tournamentTeamId: 9999, teamName: 'Snapshot FC' })),
    )

    renderAthletePage()

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))

    expect(screen.getByText('Snapshot FC')).toBeInTheDocument()
  })

  it('renders tournament seasons from the queried catalog', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValueOnce([
      { id: 1, label: 'Temporada via seam', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
    ])
    const user = userEvent.setup()
    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))
    expect(screen.getByText('Temporada via seam')).toBeInTheDocument()
  })

  it('keeps the page usable when the season catalog fails', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockRejectedValueOnce(new Error('seasons unavailable'))
    const user = userEvent.setup()
    renderAthletePage(101)

    await waitForAthletePage()
    expect(screen.queryByText('Não foi possível carregar o atleta.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))
    const tournamentLink = screen.getByRole('link', { name: /campeonato geral da puc 2026/i })
    const row = tournamentLink.closest('tr') as HTMLTableRowElement
    expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('1')
  })

  it('renders an athlete match using the scheduledAt slice', async () => {
    const [row] = await sportsApi.getAthleteMatches(RAFAEL_ID)
    vi.spyOn(sportsApi, 'getAthleteMatches').mockResolvedValue([
      { ...row, match: { id: row.match.id, scheduledAt: '2026-08-01T22:00:00.000Z' } },
    ])
    const user = userEvent.setup()

    renderAthletePage()
    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.getByText('01/08/2026')).toBeInTheDocument()
  })
})
