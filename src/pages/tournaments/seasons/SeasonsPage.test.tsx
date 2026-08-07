import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import * as sportsApi from '../../../services/sportsApi'
import { SeasonsPage } from './SeasonsPage'

vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => true }))

const season = { id: 3, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' as const }

const onePage = {
  data: [season],
  meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
  statusCode: 200,
}

const conflict = () => {
  const error = new AxiosError('conflict')
  error.response = {
    data: { error: { title: 'Conflict', message: 'duplicate', code: 'DUPLICATE_RECORD', data: {} }, statusCode: 409 },
    status: 409, statusText: 'Conflict', headers: {}, config: error.config!,
  }
  return error
}

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><SeasonsPage /></QueryClientProvider>)
}

afterEach(() => vi.restoreAllMocks())

describe('SeasonsPage', () => {
  it('lists the seasons returned by the API', async () => {
    vi.spyOn(sportsApi, 'listSeasonsPage').mockResolvedValue(onePage)
    renderPage()
    expect(await screen.findByText('2025/26')).toBeInTheDocument()
  })

  it('asks the API for archived seasons when the filter is set', async () => {
    const listSeasonsPage = vi.spyOn(sportsApi, 'listSeasonsPage').mockResolvedValue(onePage)
    renderPage()
    await screen.findByText('2025/26')
    await userEvent.click(screen.getByLabelText(/filtrar por status/i))
    await userEvent.click(screen.getByRole('option', { name: 'Arquivada' }))
    await waitFor(() =>
      expect(listSeasonsPage).toHaveBeenLastCalledWith({ page: 1, limit: 20, q: undefined, status: 'ARCHIVED' }),
    )
  })

  it('explains a duplicate label instead of failing silently', async () => {
    vi.spyOn(sportsApi, 'listSeasonsPage').mockResolvedValue(onePage)
    vi.spyOn(sportsApi, 'createSeason').mockRejectedValue(conflict())
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /nova temporada/i }))
    await userEvent.type(screen.getByLabelText(/rótulo/i), '2025/26')
    await userEvent.type(screen.getByLabelText(/início/i), '01/08/2025')
    await userEvent.type(screen.getByLabelText(/fim/i), '31/07/2026')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma temporada com esse rótulo.')
  })
})
