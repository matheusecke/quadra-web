import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import * as sportsApi from '../../services/sportsApi'
import { getTournaments as getMockTournaments } from '../../features/sports/mock-sports-data'
import type { PaginatedResponse } from '../../types/admin'
import type { Tournament } from '../../features/sports/types'
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

const pageEnvelope = (data: Tournament[]): PaginatedResponse<Tournament> => ({
  data,
  meta: { totalItems: data.length, itemCount: data.length, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
  statusCode: 200,
})

afterEach(() => vi.restoreAllMocks())

describe('TournamentsPage catalog labels', () => {
  it('renders a season label from the queried catalog', async () => {
    // listTournamentsPage now hits the real API; these tests still read the seeded demo data.
    vi.spyOn(sportsApi, 'listTournamentsPage').mockResolvedValue(pageEnvelope(getMockTournaments()))
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
    vi.spyOn(sportsApi, 'listTournamentsPage').mockResolvedValue(pageEnvelope(getMockTournaments()))
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

describe('TournamentsPage server-side filtering', () => {
  it('manda a busca e os filtros para a API em vez de filtrar no cliente', async () => {
    const spy = vi.spyOn(sportsApi, 'listTournamentsPage').mockResolvedValue(pageEnvelope(getMockTournaments()))
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([
      { id: 1, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
    ])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    renderPage()
    await screen.findByText('Campeonato Geral da PUC 2026')
    await userEvent.type(screen.getByLabelText('Buscar campeonato'), 'copa')
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ q: 'copa', page: 1, limit: 20 })),
    )
  })
})
