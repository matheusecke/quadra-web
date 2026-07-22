import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MatchDetailPage } from './MatchDetailPage'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

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
})
