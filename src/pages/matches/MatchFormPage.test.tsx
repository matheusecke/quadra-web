import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MatchFormPage } from './MatchFormPage'

const renderNew = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/matches/new']}>
        <Routes>
          <Route path="/matches/new" element={<MatchFormPage />} />
          <Route path="/matches/:matchId" element={<div>partida criada</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchFormPage', () => {
  it('rejects scheduling a team against itself', async () => {
    renderNew()
    await userEvent.selectOptions(await screen.findByLabelText(/campeonato/i), await screen.findByRole('option', { name: /copa/i }))
    const home = await screen.findByLabelText(/mandante/i)
    const away = screen.getByLabelText(/visitante/i)
    const firstTeam = (home.querySelectorAll('option')[1] as HTMLOptionElement).value
    await userEvent.selectOptions(home, firstTeam)
    await userEvent.selectOptions(away, firstTeam)
    await userEvent.click(screen.getByRole('button', { name: /agendar/i }))
    expect(screen.getByText(/não pode enfrentar a si/i)).toBeInTheDocument()
  })
})
