import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Tournament } from '../../../features/sports/types'
import { describe, expect, it, vi } from 'vitest'

import { BracketTab } from './BracketTab'

const isOrgAdmin = vi.hoisted(() => ({ value: false }))
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => isOrgAdmin.value }))

const empty = { id: 'tt-empty', name: 'Copa', format: 'KNOCKOUT', teamIds: [] } as unknown as Tournament
const demo = { id: 'puc-geral-2026', name: 'Geral', format: 'KNOCKOUT', teamIds: [] } as unknown as Tournament

const renderTab = (tournament: Tournament) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <BracketTab tournament={tournament} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('BracketTab', () => {
  it('shows an empty state before any slot exists', async () => {
    isOrgAdmin.value = false
    renderTab(empty)
    await waitFor(() =>
      expect(screen.getByText('Chaveamento ainda não montado.')).toBeInTheDocument(),
    )
  })

  it('renders no control that writes for a reader', async () => {
    isOrgAdmin.value = false
    renderTab(demo)
    await waitFor(() => expect(screen.getByText('Quartas de final')).toBeInTheDocument())
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers the round control to an admin', async () => {
    isOrgAdmin.value = true
    renderTab(demo)
    await waitFor(() => expect(screen.getByRole('button', { name: /nova rodada/i })).toBeInTheDocument())
  })
})
