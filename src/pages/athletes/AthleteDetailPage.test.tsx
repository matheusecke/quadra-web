import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AthleteDetailPage } from './AthleteDetailPage'
import * as sportsApi from '../../services/sportsApi'

const RAFAEL_ID = 101

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
  await screen.findByRole('heading', { name: /rafael moura/i })
}

afterEach(() => vi.restoreAllMocks())

describe('AthleteDetailPage', () => {
  it('renders athlete header with jersey number, name, abbreviated position, current team and status only', async () => {
    renderAthletePage()

    await waitForAthletePage()

    const header = screen.getByTestId('athlete-header')
    expect(within(header).getByText('#4')).toBeInTheDocument()
    expect(within(header).getByRole('heading', { name: /rafael moura/i })).toBeInTheDocument()
    expect(within(header).getByText(/PG · Time 1/i)).toBeInTheDocument()
    expect(within(header).getByText('Ativo')).toBeInTheDocument()
    expect(within(header).queryByText(/organização/i)).not.toBeInTheDocument()
    expect(within(header).queryByText(/2026/i)).not.toBeInTheDocument()
  })

  it('shows Não informada when the athlete position is absent', async () => {
    renderAthletePage(102)

    const header = await screen.findByTestId('athlete-header')
    expect(within(header).getByText('Não informada · Time 1')).toBeInTheDocument()
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
    expect(screen.getByRole('heading', { name: 'Aproveitamento' })).toBeInTheDocument()
    expect(screen.queryByText(/eFG/i)).not.toBeInTheDocument()
  })

  it('shows N/A for unmeasured totals and divides averages by measured games', async () => {
    const summary = await sportsApi.getAthleteSummary(RAFAEL_ID)
    vi.spyOn(sportsApi, 'getAthleteSummary').mockResolvedValue({
      ...summary,
      games: 5,
      pts: 10,
      reb: null,
      measuredGames: { ...summary.measuredGames, pts: 2, reb: 0 },
    })

    renderAthletePage()

    await waitForAthletePage()

    expect(screen.getAllByText('N/A').length).toBeGreaterThan(1)
    expect(screen.getByText('5.0')).toBeInTheDocument()
  })

  it('shows full matchup rows in Partidas and links rows to match details without an opponent column', async () => {
    const user = userEvent.setup()
    renderAthletePage()

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
    renderAthletePage()

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.getByRole('columnheader', { name: 'TOV' })).toBeInTheDocument()
  })

  it('shows team context in Campeonatos and links rows to tournament details', async () => {
    const user = userEvent.setup()
    renderAthletePage()

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

  it('recovers from a season catalog fetch failure when the retry button is clicked', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockRejectedValueOnce(new Error('seasons unavailable'))
    const user = userEvent.setup()
    renderAthletePage()

    expect(await screen.findByText('Não foi possível carregar o atleta.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitForAthletePage()
  })
})
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
