import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import * as sportsApi from '../../services/sportsApi'
import { TournamentFormPage } from './TournamentFormPage'

const season = { id: 5, label: '2026/27', startDate: '2026-08-01', endDate: '2027-07-31', status: 'ACTIVE' as const }

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><TournamentFormPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('TournamentFormPage season field', () => {
  it('asks only for active seasons', async () => {
    const getSeasons = vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(getSeasons).toHaveBeenCalledWith({ status: 'ACTIVE' }))
  })

  it('does not offer creating a season from the tournament form', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    renderPage()
    await screen.findByText('Temporada')
    expect(screen.queryByRole('button', { name: /criar temporada/i })).not.toBeInTheDocument()
  })

  it('still offers creating a category inline', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('button', { name: /criar categoria/i })).toBeInTheDocument()
  })
})
