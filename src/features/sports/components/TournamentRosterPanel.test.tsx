import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TournamentRosterPanel } from './TournamentRosterPanel'

const roster = [{ id: 'r1', athleteId: 'a1', name: 'R. Albuquerque', jerseyNumber: 7, role: 'ATHLETE' as const }]

describe('TournamentRosterPanel', () => {
  it('adds the selected athlete to the roster', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<TournamentRosterPanel roster={[]} availableAthletes={[{ id: 'ath-1', name: 'Rafael Moura' }]} onAdd={onAdd} onRemove={vi.fn()} onUpdate={vi.fn()} />)
    await userEvent.click(screen.getByLabelText(/atleta/i))
    await userEvent.click(screen.getByRole('option', { name: 'Rafael Moura' }))
    await userEvent.type(screen.getByRole('spinbutton', { name: /número/i }), '7')
    await userEvent.click(screen.getByRole('button', { name: /adicionar ao elenco/i }))
    expect(onAdd).toHaveBeenCalledWith({ athleteId: 'ath-1', jerseyNumber: 7, role: 'ATHLETE' })
  })

  it('surfaces the single-team invariant error', () => {
    render(<TournamentRosterPanel roster={[]} availableAthletes={[]} onAdd={vi.fn()} onRemove={vi.fn()} onUpdate={vi.fn()} errorMessage="Atleta já está em uma equipe no mesmo campeonato." />)
    expect(screen.getByText(/mesmo campeonato/i)).toBeInTheDocument()
  })
})

describe('TournamentRosterPanel management', () => {
  it('removes an entry after replacing the row with an inline confirmation', async () => {
    const onRemove = vi.fn()
    render(<TournamentRosterPanel roster={roster} availableAthletes={[]} onAdd={vi.fn()} onRemove={onRemove} onUpdate={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /remover/i }))
    const row = screen.getByRole('row', { name: /albuquerque/i })
    expect(within(row).getByText(/remover r\. albuquerque do elenco neste campeonato\?/i)).toBeInTheDocument()
    await userEvent.click(within(row).getByRole('button', { name: /confirmar/i }))
    expect(onRemove).toHaveBeenCalledWith('r1')
  })

  it('edits the jersey number', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    render(<TournamentRosterPanel roster={roster} availableAthletes={[]} onAdd={vi.fn()} onRemove={vi.fn()} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    const row = screen.getByRole('row', { name: /albuquerque/i })
    const number = within(row).getByRole('spinbutton')
    await userEvent.clear(number)
    await userEvent.type(number, '23')
    await userEvent.click(within(row).getByRole('button', { name: /salvar/i }))
    expect(onUpdate).toHaveBeenCalledWith('r1', { jerseyNumber: 23, role: 'ATHLETE' })
  })

  it('edits the roster role through the row-scoped Combobox', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    render(<TournamentRosterPanel roster={roster} availableAthletes={[]} onAdd={vi.fn()} onRemove={vi.fn()} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    const row = screen.getByRole('row', { name: /albuquerque/i })
    await userEvent.click(within(row).getByRole('button', { name: /papel/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Comissão técnica' }))
    await userEvent.click(within(row).getByRole('button', { name: /salvar/i }))
    expect(onUpdate).toHaveBeenCalledWith('r1', { jerseyNumber: 7, role: 'COACHING_STAFF' })
  })
})
