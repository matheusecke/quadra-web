import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MatchesPage } from './MatchesPage'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

function renderMatchesPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchesPage', () => {
  it('shows a W.O. as finished and offers only lifecycle status filters', async () => {
    const user = userEvent.setup()
    renderMatchesPage()

    const score = await screen.findByText('20 – 0')
    const row = score.closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLTableRowElement).getByText('Finalizada')).toBeInTheDocument()
    expect(screen.queryByText(/aguardando estatísticas/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Filtrar por status' }))
    expect(screen.queryByRole('option', { name: /aguardando estatísticas/i })).not.toBeInTheDocument()
  })
})
