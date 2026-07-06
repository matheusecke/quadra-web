import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TournamentRosterPanel } from './TournamentRosterPanel'

describe('TournamentRosterPanel', () => {
  it('adds the selected athlete to the roster', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<TournamentRosterPanel roster={[]} availableAthletes={[{ id: 'ath-1', name: 'Rafael Moura' }]} onAdd={onAdd} />)
    await userEvent.selectOptions(screen.getByLabelText(/atleta/i), 'ath-1')
    await userEvent.type(screen.getByLabelText(/número/i), '7')
    await userEvent.click(screen.getByRole('button', { name: /adicionar ao elenco/i }))
    expect(onAdd).toHaveBeenCalledWith({ athleteId: 'ath-1', jerseyNumber: 7, role: 'ATHLETE' })
  })

  it('surfaces the single-team invariant error', () => {
    render(<TournamentRosterPanel roster={[]} availableAthletes={[]} onAdd={vi.fn()} errorMessage="Atleta já está em uma equipe no mesmo campeonato." />)
    expect(screen.getByText(/mesmo campeonato/i)).toBeInTheDocument()
  })
})
