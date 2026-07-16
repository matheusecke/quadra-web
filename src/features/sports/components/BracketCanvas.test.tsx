import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BracketCanvas } from './BracketCanvas'
import type { BracketSlotView, BracketTeamOption } from './BracketCanvas'
import type { BracketRound } from '../../../services/sportsApi/store'

const teams: BracketTeamOption[] = [
  { tournamentTeamId: 'tt-A', name: 'Alfa', shortName: 'ALF' },
  { tournamentTeamId: 'tt-B', name: 'Beta', shortName: 'BET' },
]

const rounds: BracketRound[] = [{ id: 'r1', tournamentId: 't1', number: 1, label: 'Quartas de final' }]

const slot = (over: Partial<BracketSlotView> = {}): BracketSlotView => ({
  id: 's1', roundId: 'r1', position: 1, label: 'Semifinal 1',
  homeTournamentTeamId: null, awayTournamentTeamId: null,
  matchId: null, winnerTournamentTeamId: null, match: null, ...over,
})

const handlers = () => ({
  onFillSide: vi.fn().mockResolvedValue(undefined),
  onSetWinner: vi.fn().mockResolvedValue(undefined),
  onRenameSlot: vi.fn().mockResolvedValue(undefined),
  onSchedule: vi.fn().mockResolvedValue(undefined),
  onCreateSlot: vi.fn().mockResolvedValue(undefined),
  onCreateRound: vi.fn().mockResolvedValue(undefined),
  onRemoveSlot: vi.fn().mockResolvedValue(undefined),
})

describe('BracketCanvas', () => {
  it('fills a side from the card, with no round or position typed', async () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} isOrgAdmin {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /semifinal 1 — mandante/i }))
    await userEvent.click(screen.getByRole('option', { name: /^Alfa/ }))
    expect(h.onFillSide).toHaveBeenCalledWith('s1', 'home', 'tt-A')
  })

  it('shows a bye when only one side is filled', () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot({ homeTournamentTeamId: 'tt-A' })]} teams={teams} isOrgAdmin {...h} />)
    expect(screen.getByText(/bye/i)).toBeInTheDocument()
  })

  it('schedules the game inline, without leaving the canvas', async () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot({ homeTournamentTeamId: 'tt-A', awayTournamentTeamId: 'tt-B' })]} teams={teams} isOrgAdmin {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /agendar/i }))
    fireEvent.change(screen.getByLabelText(/data e hora/i), { target: { value: '12/08/2026 19:00' } })
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(h.onSchedule).toHaveBeenCalledWith('s1', '2026-08-12T19:00')
  })

  it('reads the score from the linked match and never offers a score field', () => {
    const h = handlers()
    render(
      <BracketCanvas
        rounds={rounds}
        slots={[slot({
          homeTournamentTeamId: 'tt-A', awayTournamentTeamId: 'tt-B', matchId: 'm1', winnerTournamentTeamId: 'tt-A',
          match: { id: 'm1', status: 'FINISHED', date: '2026-08-12T19:00', homeScore: 84, awayScore: 80 },
        })]}
        teams={teams}
        isOrgAdmin
        {...h}
      />,
    )
    expect(screen.getByText('84')).toBeInTheDocument()
    expect(screen.getByText(/vencedor/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/placar/i)).not.toBeInTheDocument()
  })

  it('crowns the winner by clicking the team, because a bye has no score to derive it from', async () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot({ homeTournamentTeamId: 'tt-A', awayTournamentTeamId: 'tt-B' })]} teams={teams} isOrgAdmin {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /definir alfa como vencedora/i }))
    expect(h.onSetWinner).toHaveBeenCalledWith('s1', 'tt-A')
  })

  it('creates a slot and a round from the ghost affordances', async () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} isOrgAdmin {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /adicionar partida/i }))
    expect(h.onCreateSlot).toHaveBeenCalledWith('r1')
    await userEvent.click(screen.getByRole('button', { name: /nova rodada/i }))
    expect(h.onCreateRound).toHaveBeenCalled()
  })

  it('gives a non-admin the same canvas, read-only', () => {
    const h = handlers()
    render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} isOrgAdmin={false} {...h} />)
    expect(screen.getAllByText(/a definir/i).length).toBe(2)
    expect(screen.queryByRole('button', { name: /mandante/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /adicionar vaga/i })).not.toBeInTheDocument()
  })

  it('names the round from the round label, not from the slot label', () => {
    render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} {...handlers()} isOrgAdmin />)
    expect(screen.getByRole('heading', { name: 'Quartas de final' })).toBeInTheDocument()
  })

  it('falls back to the round number when the round has no label', () => {
    const unnamedRounds = [{ id: 'r1', tournamentId: 't1', number: 1, label: null }]
    render(<BracketCanvas rounds={unnamedRounds} slots={[slot()]} teams={teams} {...handlers()} isOrgAdmin />)
    expect(screen.getByRole('heading', { name: 'Rodada 1' })).toBeInTheDocument()
  })
})
