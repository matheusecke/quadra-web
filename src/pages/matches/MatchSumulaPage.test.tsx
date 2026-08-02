import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchSumulaPage } from './MatchSumulaPage'
import * as sportsApi from '../../services/sportsApi'

const renderPage = (path: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/matches/:matchId/sumula" element={<MatchSumulaPage />} />
          <Route path="/matches/:matchId" element={<div>detalhe da partida</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchSumulaPage', () => {
  it('shows phase nine as unavailable without loading or writing match data', () => {
    const getMatch = vi.spyOn(sportsApi, 'getMatch')
    renderPage('/matches/501/sumula')
    expect(screen.getByText('Lançamento de resultado estará disponível após a integração da Fase 9.')).toBeInTheDocument()
    expect(getMatch).not.toHaveBeenCalled()
  })

  it('links back to the match detail', () => {
    renderPage('/matches/501/sumula')
    expect(screen.getByRole('link', { name: 'Voltar para a partida' })).toHaveAttribute('href', '/matches/501')
  })
})
