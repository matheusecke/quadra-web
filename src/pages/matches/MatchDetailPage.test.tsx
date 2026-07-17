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
    renderDetail('match-abandoned')
    expect(await screen.findByText(/placar atribuído por abandono/i)).toBeInTheDocument()
  })

  it('marks a W.O. and does not show an empty súmula as if it were missing data', async () => {
    renderDetail('match-forfeit')
    expect(await screen.findByText(/vitória por w\.o\./i)).toBeInTheDocument()
    expect(await screen.findByText('Finalizada')).toBeInTheDocument()
    expect(screen.queryByText(/aguardando estatísticas/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/placar por período/i)).not.toBeInTheDocument()
    expect(screen.getByText(/partida não disputada\. não há súmula/i)).toBeInTheDocument()
  })

  it('renders stored playing time as MM:SS in the stats tab', async () => {
    const user = userEvent.setup()
    renderDetail('puc-geral-m31')

    await user.click(await screen.findByRole('tab', { name: 'Estatísticas' }))
    const player = await screen.findByRole('link', { name: 'Rafael Moura' })
    const row = player.closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLTableRowElement).getByText('38:00')).toBeInTheDocument()
  })
})
