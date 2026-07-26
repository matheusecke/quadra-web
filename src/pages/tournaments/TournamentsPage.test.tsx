import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import * as sportsApi from '../../services/sportsApi'
import { TournamentsPage } from './TournamentsPage'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><TournamentsPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('TournamentsPage catalog labels', () => {
  it('renders a season label from the queried catalog', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValueOnce([
      { id: 1, label: 'Temporada via seam', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
    ])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValueOnce([])
    renderPage()
    const row = (await screen.findByText('Campeonato Geral da PUC 2026')).closest('tr') as HTMLTableRowElement
    expect(within(row).getByText('Temporada via seam')).toBeInTheDocument()
  })

  it('renders a category name from the queried catalog', async () => {
    // NOTE: brief's fixture used id: 1, but the seeded "Campeonato Geral da PUC 2026"
    // row has categoryId: 2 (see mock-sports-data.ts). Corrected to id: 2 so the label
    // lookup by categoryId actually matches this row (same fix as Task 4).
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValueOnce([
      { id: 1, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
    ])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValueOnce([
      { id: 2, name: 'Categoria via seam', sortOrder: 1, status: 'ACTIVE' },
    ])
    renderPage()
    const row = (await screen.findByText('Campeonato Geral da PUC 2026')).closest('tr') as HTMLTableRowElement
    expect(within(row).getByText('Categoria via seam')).toBeInTheDocument()
  })
})
