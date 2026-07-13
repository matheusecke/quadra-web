import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { TournamentDetailPage } from './TournamentDetailPage'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

const renderDetail = (id: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/tournaments/${id}`]}>
        <Routes>
          <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TournamentDetailPage info strip', () => {
  it('does not show a current phase — the phase left the screen by decision (DB spec §6.3)', async () => {
    renderDetail('puc-geral-2026')

    await waitFor(() => expect(screen.getByText(/campeonato geral/i)).toBeInTheDocument())

    expect(screen.queryByText(/fase atual/i)).not.toBeInTheDocument()
  })
})
