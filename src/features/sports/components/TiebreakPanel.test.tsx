import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TiebreakPanel } from './TiebreakPanel'
import type { StandingRow } from '../types'

const row = (teamId: number, tournamentTeamId: number, teamName: string): StandingRow => ({
  position: 1, tournamentTeamId, teamId, teamName,
  played: 2, wins: 1, losses: 1, classificationPoints: 3,
  pointsFor: 150, pointsAgainst: 150, pointDiff: 0, winPct: 0.5,
  isTiedUnresolved: true, tieBlockKey: '101-102',
})

const rows = [row(1, 101, 'Alfa'), row(2, 102, 'Beta')]

describe('TiebreakPanel', () => {
  it('has no button that draws — only one that records a draw', () => {
    render(<TiebreakPanel rows={rows} standingsState="FINAL" isResolved={false} onSave={vi.fn()} onClear={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /^sortear$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrar sorteio/i })).toBeInTheDocument()
  })

  it('saves the recorded order over the whole block', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<TiebreakPanel rows={rows} standingsState="FINAL" isResolved={false} onSave={onSave} onClear={vi.fn()} onCancel={vi.fn()} />)
    await userEvent.click(screen.getByLabelText(/posição de alfa/i))
    await userEvent.click(screen.getByRole('option', { name: '2º' }))
    await userEvent.click(screen.getByLabelText(/posição de beta/i))
    await userEvent.click(screen.getByRole('option', { name: '1º' }))
    await userEvent.click(screen.getByRole('button', { name: /registrar sorteio/i }))
    expect(onSave).toHaveBeenCalledWith([
      { tournamentTeamId: 101, order: 2 },
      { tournamentTeamId: 102, order: 1 },
    ])
  })

  it('refuses to save an order that repeats a position', async () => {
    const onSave = vi.fn()
    render(<TiebreakPanel rows={rows} standingsState="FINAL" isResolved={false} onSave={onSave} onClear={vi.fn()} onCancel={vi.fn()} />)
    await userEvent.click(screen.getByLabelText(/posição de alfa/i))
    await userEvent.click(screen.getByRole('option', { name: '1º' }))
    await userEvent.click(screen.getByLabelText(/posição de beta/i))
    await userEvent.click(screen.getByRole('option', { name: '1º' }))
    expect(screen.getByRole('button', { name: /registrar sorteio/i })).toBeDisabled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('warns that a draw recorded mid-stage will probably stop counting', () => {
    render(<TiebreakPanel rows={rows} standingsState="PARTIAL" isResolved={false} onSave={vi.fn()} onClear={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText(/deixará de ter efeito/i)).toBeInTheDocument()
  })
})
