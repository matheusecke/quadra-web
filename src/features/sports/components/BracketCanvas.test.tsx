import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BracketCanvas } from './BracketCanvas'
import type { BracketRound, BracketSlotView } from '../types'
import type { BracketTeamOption } from '../useBracketView'

const teams: BracketTeamOption[] = [
  { tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' },
  { tournamentTeamId: 2, name: 'Beta', shortName: 'BET' },
]

const rounds: BracketRound[] = [{ id: 1, tournamentId: 1, number: 1, label: 'Quartas de final' }]

const slot = (over: Partial<BracketSlotView> = {}): BracketSlotView => ({
  id: 11, roundId: 1, position: 1, label: 'Semifinal 1',
  homeTeam: null, awayTeam: null, winnerTournamentTeamId: null, ...over,
})

const handlers = () => ({
  onFillSide: vi.fn().mockResolvedValue(undefined),
  onRenameSlot: vi.fn().mockResolvedValue(undefined),
  onCreateSlot: vi.fn().mockResolvedValue(undefined),
  onRemoveSlot: vi.fn().mockResolvedValue(undefined),
  onCreateRound: vi.fn().mockResolvedValue(undefined),
  onRenameRound: vi.fn().mockResolvedValue(undefined),
  onRemoveRound: vi.fn().mockResolvedValue(undefined),
})

describe('BracketCanvas', () => {
  it('fills a side from the card, with no round or position typed', async () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /semifinal 1 — mandante/i }))
    await userEvent.click(screen.getByRole('option', { name: /^Alfa/ }))
    expect(h.onFillSide).toHaveBeenCalledWith(11, 'home', 1)
  })

  it('shows a bye when only one side is filled', () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot({ homeTeam: { tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' } })]} teams={teams} {...h} />)
    expect(screen.getByText(/bye/i)).toBeInTheDocument()
  })

  it('creates a slot and a round from the ghost affordances', async () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /adicionar partida/i }))
    expect(h.onCreateSlot).toHaveBeenCalledWith(1)
    await userEvent.click(screen.getByRole('button', { name: /nova rodada/i }))
    expect(h.onCreateRound).toHaveBeenCalled()
  })

  it('names the round from the round label, not from the slot label', () => {
    render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} {...handlers()} />)
    expect(screen.getByRole('button', { name: 'Quartas de final' })).toBeInTheDocument()
  })

  it('falls back to the round number when the round has no label', () => {
    const unnamedRounds = [{ id: 1, tournamentId: 1, number: 1, label: null }]
    render(<BracketCanvas rounds={unnamedRounds} slots={[slot()]} teams={teams} {...handlers()} />)
    expect(screen.getByRole('button', { name: 'Rodada 1' })).toBeInTheDocument()
  })

  it('clears a filled side through the remove option', async () => {
    const props = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot({ homeTeam: { tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' } })]} teams={teams} {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /Semifinal 1 — mandante/ }))
    await userEvent.click(screen.getByRole('option', { name: 'Remover equipe' }))
    expect(props.onFillSide).toHaveBeenCalledWith(11, 'home', null)
  })

  it('renames a round to the trimmed label', async () => {
    const props = handlers()
    render(<BracketCanvas rounds={rounds} slots={[]} teams={teams} {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Quartas de final' }))
    const field = screen.getByLabelText('Nome da rodada')
    await userEvent.clear(field)
    await userEvent.type(field, '  Oitavas  ')
    fireEvent.blur(field)
    expect(props.onRenameRound).toHaveBeenCalledWith(1, 'Oitavas')
  })

  it('clears a round label when the field is emptied', async () => {
    const props = handlers()
    render(<BracketCanvas rounds={rounds} slots={[]} teams={teams} {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Quartas de final' }))
    const field = screen.getByLabelText('Nome da rodada')
    await userEvent.clear(field)
    fireEvent.blur(field)
    expect(props.onRenameRound).toHaveBeenCalledWith(1, null)
  })
})
