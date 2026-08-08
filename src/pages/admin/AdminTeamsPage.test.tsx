import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminTeamsPage } from './AdminTeamsPage'
import * as adminApi from '../../services/adminApi'
import type { AdminTeam } from '../../types/admin'

const team: AdminTeam = {
  id: 8,
  name: 'Engenharia PUC',
  slug: 'engenharia-puc',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const page = {
  data: [team],
  meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
  statusCode: 200,
}

function renderAdminTeams() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminTeamsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.restoreAllMocks())

beforeEach(() => {
  vi.spyOn(adminApi, 'listTeams').mockResolvedValue(page)
  vi.spyOn(adminApi, 'getTeam').mockResolvedValue(team)
})

describe('AdminTeamsPage', () => {
  it('opens the edit drawer when an admin row is activated', async () => {
    const user = userEvent.setup()
    renderAdminTeams()
    const row = await screen.findByRole('row', { name: /engenharia puc/i })

    await user.click(row)

    expect(await screen.findByRole('dialog', { name: 'Engenharia PUC' })).toBeInTheDocument()
  })

  it('does not redirect the admin team row to the sports profile', async () => {
    renderAdminTeams()
    const row = await screen.findByRole('row', { name: /engenharia puc/i })

    expect(within(row).queryByRole('link')).not.toBeInTheDocument()
  })
})
