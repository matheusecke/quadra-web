import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SeasonsPage } from './SeasonsPage'

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><SeasonsPage /></QueryClientProvider>)
}

describe('SeasonsPage', () => {
  it('creates a season and shows it in the list', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /nova temporada/i }))
    await userEvent.type(screen.getByLabelText(/rótulo/i), '2027/28')
    await userEvent.type(screen.getByLabelText(/início/i), '01/08/2027')
    await userEvent.type(screen.getByLabelText(/fim/i), '31/07/2028')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(screen.getByText('2027/28')).toBeInTheDocument())
  })
})
