import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AthleteDetailPage } from './AthleteDetailPage'

const RAFAEL_ID = 'rafael.moura@quadra.com.br'

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
    renderAthletePage('diego.santos@quadra.com.br')

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

  it('shows full matchup rows in Partidas and links rows to match details without an opponent column', async () => {
    const user = userEvent.setup()
    renderAthletePage()

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.queryByRole('columnheader', { name: /adversário/i })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /partida/i })).toBeInTheDocument()
    const finalLink = screen.getAllByRole('link', { name: /time 1 × time 2/i }).find(
      (link) => link.getAttribute('href') === '/matches/puc-geral-m31',
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

    expect(screen.getByRole('columnheader', { name: 'TOV', exact: true })).toBeInTheDocument()
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
      '/tournaments/puc-geral-2026',
    )
  })
})
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
