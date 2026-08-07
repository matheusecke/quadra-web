import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TournamentRosterPanel } from './TournamentRosterPanel'
import type { RosterDisplayEntry, TournamentRosterPanelProps } from './TournamentRosterPanel'

const roster88: RosterDisplayEntry = { id: 88, userId: 165, name: 'Rafael Moura', jerseyNumber: 7, role: 'ATHLETE' }

function renderPanel(overrides: Partial<TournamentRosterPanelProps> = {}) {
  const props: TournamentRosterPanelProps = {
    roster: [],
    isLoading: false,
    isError: false,
    onRetry: vi.fn(),
    onSearchCandidates: vi.fn().mockResolvedValue([]),
    onAdd: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  render(<TournamentRosterPanel {...props} />)
  return props
}

const chooseCandidate = async (name: string) => {
  await userEvent.click(screen.getByRole('combobox'))
  await userEvent.type(screen.getByRole('combobox'), name)
  await userEvent.click(await screen.findByRole('option', { name }))
}

describe('TournamentRosterPanel', () => {
  it('renders the server snapshot and an em dash for a null jersey', () => {
    renderPanel({ roster: [{ ...roster88, jerseyNumber: null }] })
    expect(screen.getByText('Rafael Moura')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('searches candidates for the currently selected role', async () => {
    const onSearchCandidates = vi.fn().mockResolvedValue([{ id: 165, label: 'Rafael Moura' }])
    renderPanel({ onSearchCandidates })
    await chooseCandidate('Rafael Moura')
    expect(onSearchCandidates).toHaveBeenCalledWith('Rafael Moura', 'ATHLETE')
  })

  it('omits a blank jersey on create', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const onSearchCandidates = vi.fn().mockResolvedValue([{ id: 165, label: 'Rafael Moura' }])
    renderPanel({ onAdd, onSearchCandidates })
    await chooseCandidate('Rafael Moura')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ao elenco' }))
    expect(onAdd).toHaveBeenCalledWith({ userId: 165, role: 'ATHLETE' })
  })

  it('sends a typed jersey number on create', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const onSearchCandidates = vi.fn().mockResolvedValue([{ id: 165, label: 'Rafael Moura' }])
    renderPanel({ onAdd, onSearchCandidates })
    await chooseCandidate('Rafael Moura')
    await userEvent.type(screen.getByRole('spinbutton', { name: /número/i }), '4')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ao elenco' }))
    expect(onAdd).toHaveBeenCalledWith({ userId: 165, role: 'ATHLETE', jerseyNumber: 4 })
  })

  it('clears the selected candidate and requests the new role when the role changes', async () => {
    const onSearchCandidates = vi.fn().mockResolvedValue([{ id: 165, label: 'Rafael Moura' }])
    renderPanel({ onSearchCandidates })
    await chooseCandidate('Rafael Moura')
    await userEvent.click(screen.getByRole('button', { name: 'Papel' }))
    await userEvent.click(screen.getByRole('option', { name: 'Comissão técnica' }))
    expect(screen.getByRole('combobox')).toHaveValue('')
    onSearchCandidates.mockClear()
    await userEvent.type(screen.getByRole('combobox'), 'Rafael')
    await waitFor(() => expect(onSearchCandidates).toHaveBeenCalledWith('Rafael', 'COACHING_STAFF'))
  })

  it('ignores an athlete search that resolves after the role changes', async () => {
    let resolveSearch!: (value: Array<{ id: number; label: string }>) => void
    const onSearchCandidates = vi.fn(() => new Promise<Array<{ id: number; label: string }>>((resolve) => {
      resolveSearch = resolve
    }))
    renderPanel({ onSearchCandidates })
    await userEvent.type(screen.getByRole('combobox'), 'Rafael')
    await waitFor(() => expect(onSearchCandidates).toHaveBeenCalledWith('Rafael', 'ATHLETE'))
    await userEvent.click(screen.getByRole('button', { name: 'Papel' }))
    await userEvent.click(screen.getByRole('option', { name: 'Comissão técnica' }))
    await act(async () => resolveSearch([{ id: 165, label: 'Rafael Moura' }]))

    expect(screen.queryByRole('option', { name: 'Rafael Moura' })).not.toBeInTheDocument()
  })

  it('sends null when an existing jersey is cleared', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderPanel({ roster: [roster88], onUpdate })
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    const row = screen.getByRole('row', { name: /moura/i })
    await userEvent.clear(within(row).getByRole('spinbutton', { name: 'Número' }))
    await userEvent.click(within(row).getByRole('button', { name: 'Salvar' }))
    expect(onUpdate).toHaveBeenCalledWith(88, { jerseyNumber: null, role: 'ATHLETE' })
  })

  it('shows the loading treatment instead of the table', () => {
    renderPanel({ roster: [roster88], isLoading: true })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('Rafael Moura')).not.toBeInTheDocument()
  })

  it('shows an error with retry instead of the table', async () => {
    const onRetry = vi.fn()
    renderPanel({ isError: true, onRetry })
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows an empty state when the roster has no members', () => {
    renderPanel({ roster: [] })
    expect(screen.getByText('Elenco vazio.')).toBeInTheDocument()
  })

  it('surfaces a write error message', () => {
    renderPanel({ errorMessage: 'Atleta já está em uma equipe no mesmo campeonato.' })
    expect(screen.getByRole('alert')).toHaveTextContent('mesmo campeonato')
  })
})

describe('TournamentRosterPanel management', () => {
  it('removes an entry after replacing the row with an inline confirmation', async () => {
    const onRemove = vi.fn()
    renderPanel({ roster: [roster88], onRemove })
    await userEvent.click(screen.getByRole('button', { name: /remover/i }))
    const row = screen.getByRole('row', { name: /moura/i })
    expect(within(row).getByText(/remover rafael moura do elenco neste campeonato\?/i)).toBeInTheDocument()
    await userEvent.click(within(row).getByRole('button', { name: /confirmar/i }))
    expect(onRemove).toHaveBeenCalledWith(88)
  })

  it('edits the jersey number', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderPanel({ roster: [roster88], onUpdate })
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    const row = screen.getByRole('row', { name: /moura/i })
    const number = within(row).getByRole('spinbutton')
    await userEvent.clear(number)
    await userEvent.type(number, '23')
    await userEvent.click(within(row).getByRole('button', { name: /salvar/i }))
    expect(onUpdate).toHaveBeenCalledWith(88, { jerseyNumber: 23, role: 'ATHLETE' })
  })

  it('edits the roster role through the row-scoped Combobox', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderPanel({ roster: [roster88], onUpdate })
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    const row = screen.getByRole('row', { name: /moura/i })
    await userEvent.click(within(row).getByRole('button', { name: /papel/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Comissão técnica' }))
    await userEvent.click(within(row).getByRole('button', { name: /salvar/i }))
    expect(onUpdate).toHaveBeenCalledWith(88, { jerseyNumber: 7, role: 'COACHING_STAFF' })
  })
})
