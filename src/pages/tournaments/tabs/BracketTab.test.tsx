import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BracketTab } from './BracketTab'
import type { Tournament } from '../../../features/sports/types'

vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

const tournament = { id: 'tt-empty', name: 'Copa', format: 'KNOCKOUT', teamIds: [] } as unknown as Tournament

describe('BracketTab', () => {
  it('shows an empty state before any slot exists', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <BracketTab tournament={tournament} />
        </QueryClientProvider>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText(/nenhuma vaga de chaveamento/i)).toBeInTheDocument())
  })
})
