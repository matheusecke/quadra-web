import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from './Combobox'
import type { ComboboxOption } from './Combobox'

const short: ComboboxOption[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
]

const long: ComboboxOption[] = Array.from({ length: 12 }, (_, index) => ({
  value: `t${index}`,
  label: index === 0 ? 'Tigres do Cerrado' : `Equipe ${index}`,
}))

describe('Combobox', () => {
  it('reports the chosen option', async () => {
    const onChange = vi.fn()
    render(<Combobox aria-label="Status" options={short} value={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /status/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Em andamento' }))
    expect(onChange).toHaveBeenCalledWith('IN_PROGRESS')
  })

  it('picks with the keyboard alone, because that is what the native select gave us for free', async () => {
    const onChange = vi.fn()
    render(<Combobox aria-label="Status" options={short} value={null} onChange={onChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}{ArrowDown}{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('IN_PROGRESS')
  })

  it('closes on Escape and hands focus back to the field', async () => {
    render(<Combobox aria-label="Status" options={short} value={null} onChange={vi.fn()} />)
    const field = screen.getByRole('button', { name: /status/i })
    await userEvent.click(field)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(field).toHaveFocus()
  })

  it('offers no search box for a short list — it would be noise', async () => {
    render(<Combobox aria-label="Status" options={short} value={null} onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /status/i }))
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('offers a search box past the threshold, and filters', async () => {
    render(<Combobox aria-label="Equipe" options={long} value={null} onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /equipe/i }))
    await userEvent.type(screen.getByRole('searchbox'), 'tigres')
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('says so when the search matches nothing', async () => {
    render(<Combobox aria-label="Equipe" options={long} value={null} onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /equipe/i }))
    await userEvent.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText(/nenhum resultado/i)).toBeInTheDocument()
  })

  it('marks the current option as selected, for the screen reader', async () => {
    render(<Combobox aria-label="Status" options={short} value="DRAFT" onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /status/i }))
    expect(screen.getByRole('option', { name: 'Rascunho' })).toHaveAttribute('aria-selected', 'true')
  })

  it('does not open when disabled', async () => {
    render(<Combobox aria-label="Grupo" options={short} value={null} onChange={vi.fn()} disabled />)
    await userEvent.click(screen.getByRole('button', { name: /grupo/i }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
