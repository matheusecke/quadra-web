import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { TournamentFormPage } from './TournamentFormPage'

const renderNew = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/tournaments/new']}>
        <Routes>
          <Route path="/tournaments/new" element={<TournamentFormPage />} />
          <Route path="/tournaments/:tournamentId" element={<div>detalhe</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TournamentFormPage (create)', () => {
  it('creates a tournament and navigates to its detail', async () => {
    renderNew()
    await userEvent.type(screen.getByLabelText(/nome/i), 'Copa de Verão')
    await userEvent.click(await screen.findByLabelText(/temporada/i))
    await userEvent.click(screen.getByRole('option', { name: '2025/26' }))
    await userEvent.click(screen.getByLabelText(/formato/i))
    await userEvent.click(screen.getByRole('option', { name: 'Grupos + mata-mata' }))
    await userEvent.type(screen.getByLabelText(/início/i), '01/02/2026')
    await userEvent.type(screen.getByLabelText(/fim/i), '01/06/2026')
    await userEvent.click(screen.getByRole('button', { name: /criar campeonato/i }))
    await waitFor(() => expect(screen.getByText('detalhe')).toBeInTheDocument())
  })
})
