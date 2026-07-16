import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategoriesPage } from './CategoriesPage'

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><CategoriesPage /></QueryClientProvider>)
}

describe('CategoriesPage', () => {
  it('creates a category and shows it in the list', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /nova categoria/i }))
    await userEvent.type(screen.getByLabelText(/nome/i), 'Veterano')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(screen.getByText('Veterano')).toBeInTheDocument())
  })
})
