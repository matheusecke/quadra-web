import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MatchSumulaPage } from './MatchSumulaPage'

const renderSumula = (matchId: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/matches/${matchId}/sumula`]}>
        <Routes>
          <Route path="/matches/:matchId/sumula" element={<MatchSumulaPage />} />
          <Route path="/matches/:matchId" element={<div>detalhe da partida</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchSumulaPage', () => {
  it('warns when total points do not match the final score', async () => {
    renderSumula('match-1')
    const anyPts = await screen.findAllByLabelText(/pts/i)
    await userEvent.type(anyPts[0], '5')
    await waitFor(() => expect(screen.getByText(/não confere com o placar/i)).toBeInTheDocument())
  })

  it('submits the result and returns to the match detail', async () => {
    renderSumula('match-1')
    await userEvent.click(await screen.findByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(await screen.findByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())
  })
})
