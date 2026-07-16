import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReopenTournamentPanel } from './ReopenTournamentPanel'

describe('ReopenTournamentPanel', () => {
  it('confirms the reopen', async () => {
    const onConfirm = vi.fn()
    render(<ReopenTournamentPanel championName="Time 1" onConfirm={onConfirm} onCancel={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reabertura' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('cancels the reopen', async () => {
    const onCancel = vi.fn()
    render(<ReopenTournamentPanel championName="Time 1" onConfirm={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('disables the confirm button while loading', () => {
    render(<ReopenTournamentPanel championName="Time 1" onConfirm={vi.fn()} onCancel={vi.fn()} loading />)
    expect(screen.getByRole('button', { name: 'Confirmar reabertura' })).toBeDisabled()
  })

  it('shows an error message', () => {
    render(<ReopenTournamentPanel championName="Time 1" onConfirm={vi.fn()} onCancel={vi.fn()} errorMessage="Não foi possível reabrir o campeonato." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível reabrir o campeonato.')
  })
})
