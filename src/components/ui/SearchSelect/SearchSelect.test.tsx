import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchSelect } from './SearchSelect'

const options = [{ id: 1, label: 'Tigres do Cerrado' }, { id: 2, label: 'Corujas de Aço' }]

describe('SearchSelect', () => {
  it('reports the option picked from a remote search', async () => {
    const onChange = vi.fn()
    const onSearch = vi.fn().mockResolvedValue(options)
    render(<SearchSelect value={null} onChange={onChange} onSearch={onSearch} placeholder="Buscar equipe" />)
    await userEvent.type(screen.getByPlaceholderText('Buscar equipe'), 'tig')
    await userEvent.click(await screen.findByRole('option', { name: /tigres/i }))
    expect(onChange).toHaveBeenCalledWith(options[0])
  })

  it('says so when the remote search fails, instead of showing an empty list', async () => {
    const onSearch = vi.fn().mockRejectedValue(new Error('offline'))
    render(<SearchSelect value={null} onChange={vi.fn()} onSearch={onSearch} placeholder="Buscar equipe" />)
    await userEvent.type(screen.getByPlaceholderText('Buscar equipe'), 'tig')
    expect(await screen.findByText(/erro/i)).toBeInTheDocument()
  })
})
