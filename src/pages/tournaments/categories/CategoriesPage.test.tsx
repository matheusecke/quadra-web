import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import * as sportsApi from '../../../services/sportsApi'
import { CategoriesPage } from './CategoriesPage'

vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => true }))

const onePage = {
  data: [
    { id: 2, name: 'Adulto Masculino', sortOrder: 2, status: 'ACTIVE' as const },
    { id: 4, name: 'Adulto Feminino', sortOrder: null, status: 'INACTIVE' as const },
  ],
  meta: { totalItems: 2, itemCount: 2, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
  statusCode: 200,
}

const conflict = () => {
  const error = new AxiosError('conflict')
  error.response = {
    data: { error: { title: 'Conflict', message: 'A category with this slug already exists.', code: 'DUPLICATE_RECORD', data: {} }, statusCode: 409 },
    status: 409, statusText: 'Conflict', headers: {}, config: error.config!,
  }
  return error
}

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><CategoriesPage /></QueryClientProvider>)
}

afterEach(() => vi.restoreAllMocks())

describe('CategoriesPage', () => {
  it('keeps the order the API sent, with the unordered category last', async () => {
    vi.spyOn(sportsApi, 'listCategoriesPage').mockResolvedValue(onePage)
    renderPage()
    const rows = await screen.findAllByRole('row')
    expect(rows.at(-2)).toHaveTextContent('Adulto Feminino')
  })

  it('renders a dash for a category without manual ordering', async () => {
    vi.spyOn(sportsApi, 'listCategoriesPage').mockResolvedValue(onePage)
    renderPage()
    const row = (await screen.findByText('Adulto Feminino')).closest('tr') as HTMLTableRowElement
    expect(row).toHaveTextContent('—')
  })

  it('explains a duplicate category instead of failing silently', async () => {
    vi.spyOn(sportsApi, 'listCategoriesPage').mockResolvedValue(onePage)
    vi.spyOn(sportsApi, 'createCategory').mockRejectedValue(conflict())
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /nova categoria/i }))
    await userEvent.type(screen.getByLabelText(/nome/i), 'Sub 17')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma categoria com esse nome')
  })
})
