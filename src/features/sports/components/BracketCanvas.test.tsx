import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { BracketCanvas } from './BracketCanvas'
import { formatDateTime } from '../sportsUtils'
import type { BracketMatchView, BracketRound, BracketSlotView } from '../types'
import type { BracketTeamOption } from '../useBracketView'

const teams: BracketTeamOption[] = [
  { tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' },
  { tournamentTeamId: 2, name: 'Beta', shortName: 'BET' },
]

const rounds: BracketRound[] = [{ id: 1, tournamentId: 1, number: 1, label: 'Quartas de final' }]

const slot = (over: Partial<BracketSlotView> = {}): BracketSlotView => ({
  id: 11, roundId: 1, position: 1, label: 'Semifinal 1',
  homeTeam: null, awayTeam: null, match: null, winnerTournamentTeamId: null, ...over,
})

const handlers = () => ({
  tournamentId: 1,
  tournamentStatus: 'IN_PROGRESS' as const,
  canEditStructure: true,
  canSetWinner: false,
  busySlotId: null,
  onFillSide: vi.fn().mockResolvedValue(undefined),
  onRenameSlot: vi.fn().mockResolvedValue(undefined),
  onCreateSlot: vi.fn().mockResolvedValue(undefined),
  onRemoveSlot: vi.fn().mockResolvedValue(undefined),
  onCreateRound: vi.fn().mockResolvedValue(undefined),
  onRenameRound: vi.fn().mockResolvedValue(undefined),
  onRemoveRound: vi.fn().mockResolvedValue(undefined),
  onSearchMatches: vi.fn().mockResolvedValue([]),
  onLinkMatch: vi.fn().mockResolvedValue(undefined),
  onUnlinkMatch: vi.fn().mockResolvedValue(undefined),
  onSetWinner: vi.fn().mockResolvedValue(undefined),
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

  it('preserves the slot order received from the API', () => {
    render(<BracketCanvas
      rounds={rounds}
      slots={[
        slot({ id: 12, position: 2, label: 'Recebida primeiro' }),
        slot({ id: 11, position: 1, label: 'Recebida depois' }),
      ]}
      teams={teams}
      {...handlers()}
    />)

    expect(screen.getAllByText(/Recebida (primeiro|depois)/).map((button) => button.textContent)).toEqual([
      'Recebida primeiro',
      'Recebida depois',
    ])
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

  describe('linked match', () => {
    const linkedMatch: BracketMatchView = { id: 501, status: 'FINISHED', date: '2026-08-01T22:00:00.000Z', homeScore: 72, awayScore: 68 }

    it('shows no linked match block when the slot has none', () => {
      render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} {...handlers()} />)
      expect(screen.queryByLabelText('Partida vinculada')).not.toBeInTheDocument()
    })

    it('links to the linked match, with its status, date and score', () => {
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot({ match: linkedMatch })]} teams={teams} {...handlers()} />
        </MemoryRouter>,
      )
      expect(screen.getByRole('link', { name: /Partida #501/ })).toHaveAttribute('href', '/matches/501')
      expect(screen.getByText('Finalizada')).toBeInTheDocument()
      expect(screen.getByText(formatDateTime(linkedMatch.date!))).toBeInTheDocument()
      expect(screen.getByText('72 × 68')).toBeInTheDocument()
    })

    it('keeps the score in its own block, not attached to either side name', () => {
      render(
        <MemoryRouter>
          <BracketCanvas
            rounds={rounds}
            slots={[slot({ homeTeam: { tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' }, match: linkedMatch })]}
            teams={teams}
            {...handlers()}
          />
        </MemoryRouter>,
      )
      expect(screen.getByText('72 × 68').closest('article')).toContainElement(screen.getByLabelText(/mandante/))
    })

    it('shows a placeholder when the linked match has no date or score yet', () => {
      render(
        <MemoryRouter>
          <BracketCanvas
            rounds={rounds}
            slots={[slot({ match: { id: 501, status: 'SCHEDULED', date: null, homeScore: null, awayScore: null } })]}
            teams={teams}
            {...handlers()}
          />
        </MemoryRouter>,
      )
      expect(screen.getByText('Data não informada')).toBeInTheDocument()
      expect(screen.getByText('Placar indisponível')).toBeInTheDocument()
    })
  })

  describe('link and unlink a match', () => {
    const renderEmptySlot = (over: Partial<ReturnType<typeof handlers>> = {}) => {
      const props = { ...handlers(), ...over }
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} {...props} />
        </MemoryRouter>,
      )
      return props
    }

    it('searches through the callback as the admin types, without writing', async () => {
      const props = renderEmptySlot({ onSearchMatches: vi.fn().mockResolvedValue([{ id: 501, label: 'Alfa × Beta', secondary: '01/08/2026' }]) })
      await userEvent.type(screen.getByPlaceholderText('Buscar partida…'), 'Alfa')
      await screen.findByRole('option', { name: /Alfa × Beta/ })
      expect(props.onSearchMatches).toHaveBeenCalledWith(slot(), 'Alfa')
      expect(props.onLinkMatch).not.toHaveBeenCalled()
    })

    it('links the selected match only when the button is clicked', async () => {
      const props = renderEmptySlot({ onSearchMatches: vi.fn().mockResolvedValue([{ id: 501, label: 'Alfa × Beta' }]) })
      await userEvent.type(screen.getByPlaceholderText('Buscar partida…'), 'Alfa')
      await userEvent.click(await screen.findByRole('option', { name: 'Alfa × Beta' }))
      expect(props.onLinkMatch).not.toHaveBeenCalled()
      await userEvent.click(screen.getByRole('button', { name: 'Vincular partida' }))
      expect(props.onLinkMatch).toHaveBeenCalledWith(11, 501)
    })

    it('disables linking until a match is selected', () => {
      renderEmptySlot()
      expect(screen.getByRole('button', { name: 'Vincular partida' })).toBeDisabled()
    })

    it('clears the selection once the link is accepted', async () => {
      renderEmptySlot({
        onSearchMatches: vi.fn().mockResolvedValue([{ id: 501, label: 'Alfa × Beta' }]),
        onLinkMatch: vi.fn().mockResolvedValue('clear'),
      })
      await userEvent.type(screen.getByPlaceholderText('Buscar partida…'), 'Alfa')
      await userEvent.click(await screen.findByRole('option', { name: 'Alfa × Beta' }))
      await userEvent.click(screen.getByRole('button', { name: 'Vincular partida' }))

      expect(await screen.findByRole('button', { name: 'Vincular partida' })).toBeDisabled()
    })

    it('keeps the selection when the refusal is fixable by reviewing the pick', async () => {
      renderEmptySlot({
        onSearchMatches: vi.fn().mockResolvedValue([{ id: 501, label: 'Alfa × Beta' }]),
        onLinkMatch: vi.fn().mockResolvedValue('keep'),
      })
      await userEvent.type(screen.getByPlaceholderText('Buscar partida…'), 'Alfa')
      await userEvent.click(await screen.findByRole('option', { name: 'Alfa × Beta' }))
      await userEvent.click(screen.getByRole('button', { name: 'Vincular partida' }))

      expect(screen.getByRole('button', { name: 'Vincular partida' })).not.toBeDisabled()
    })

    it('leaves another slot usable while one slot is writing', () => {
      const props = { ...handlers(), busySlotId: 11 }
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot({ id: 11 }), slot({ id: 12, position: 2, label: 'Semifinal 2' })]} teams={teams} {...props} />
        </MemoryRouter>,
      )

      expect(screen.getAllByPlaceholderText('Buscar partida…')[1]).not.toBeDisabled()
    })

    it('hides search and link controls for a reader without structure edit rights', () => {
      renderEmptySlot({ canEditStructure: false })
      expect(screen.queryByPlaceholderText('Buscar partida…')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Vincular partida' })).not.toBeInTheDocument()
    })

    it('explains that a finished match cannot be unlinked, with no unlink control', () => {
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot({ match: { id: 501, status: 'FINISHED', date: null, homeScore: null, awayScore: null } })]} teams={teams} {...handlers()} />
        </MemoryRouter>,
      )
      expect(screen.getByText('Partida finalizada não pode ser desvinculada.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /desvincular/i })).not.toBeInTheDocument()
    })

    it('warns that unlinking a scheduled match will cancel it before confirming', async () => {
      const props = handlers()
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot({ match: { id: 501, status: 'SCHEDULED', date: null, homeScore: null, awayScore: null } })]} teams={teams} {...props} />
        </MemoryRouter>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Desvincular partida' }))
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Desvincular cancelará a partida e ela não poderá ser reativada nesta fase.')
      expect(props.onUnlinkMatch).not.toHaveBeenCalled()
    })

    it('warns with a lighter copy when unlinking an already cancelled match', async () => {
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot({ match: { id: 501, status: 'CANCELLED', date: null, homeScore: null, awayScore: null } })]} teams={teams} {...handlers()} />
        </MemoryRouter>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Desvincular partida' }))
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Desvincular removerá a partida desta vaga.')
    })

    it('unlinks only after the confirmation is accepted, reachable by keyboard', async () => {
      const props = handlers()
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot({ match: { id: 501, status: 'SCHEDULED', date: null, homeScore: null, awayScore: null } })]} teams={teams} {...props} />
        </MemoryRouter>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Desvincular partida' }))
      const dialog = screen.getByRole('alertdialog')
      const confirm = screen.getByRole('button', { name: 'Confirmar desvínculo' })
      expect(dialog).toContainElement(screen.getByRole('button', { name: 'Voltar' }))
      expect(dialog).toContainElement(confirm)
      confirm.focus()
      await userEvent.keyboard('{Enter}')
      expect(props.onUnlinkMatch).toHaveBeenCalledWith(slot({ match: { id: 501, status: 'SCHEDULED', date: null, homeScore: null, awayScore: null } }))
    })

    it('cancels the unlink confirmation without writing', async () => {
      const props = handlers()
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[slot({ match: { id: 501, status: 'SCHEDULED', date: null, homeScore: null, awayScore: null } })]} teams={teams} {...props} />
        </MemoryRouter>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Desvincular partida' }))
      await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(props.onUnlinkMatch).not.toHaveBeenCalled()
    })
  })

  describe('read-only structure', () => {
    it('hides every structure-editing control when the admin cannot edit structure', () => {
      render(<BracketCanvas rounds={rounds} slots={[slot({ homeTeam: { tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' } })]} teams={teams} {...handlers()} canEditStructure={false} />)
      expect(screen.queryByRole('button', { name: /nova rodada/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /adicionar partida/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /mandante|visitante/i })).not.toBeInTheDocument()
      expect(screen.getByText('Alfa')).toBeInTheDocument()
    })

    it('still shows the round and slot titles as plain text', () => {
      render(<BracketCanvas rounds={rounds} slots={[slot()]} teams={teams} {...handlers()} canEditStructure={false} />)
      expect(screen.getByText('Quartas de final')).toBeInTheDocument()
      expect(screen.getByText('Semifinal 1')).toBeInTheDocument()
    })
  })

  describe('set the slot winner', () => {
    const filledSlot = slot({
      homeTeam: { tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' },
      awayTeam: { tournamentTeamId: 2, name: 'Beta', shortName: 'BET' },
    })

    it('shows no winner control when the admin cannot set winners', () => {
      render(<BracketCanvas rounds={rounds} slots={[filledSlot]} teams={teams} {...handlers()} canSetWinner={false} />)
      expect(screen.queryByRole('button', { name: /vencedor/i })).not.toBeInTheDocument()
    })

    it('offers only the filled sides plus a no-winner option', async () => {
      render(<BracketCanvas rounds={rounds} slots={[filledSlot]} teams={teams} {...handlers()} canSetWinner={true} />)
      await userEvent.click(screen.getByRole('button', { name: /vencedor/i }))
      expect(screen.getByRole('option', { name: 'Sem vencedor' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Alfa' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument()
    })

    it('writes the chosen winner directly outside a completed tournament', async () => {
      const props = handlers()
      render(<BracketCanvas rounds={rounds} slots={[filledSlot]} teams={teams} {...props} canSetWinner={true} />)
      await userEvent.click(screen.getByRole('button', { name: /vencedor/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Alfa' }))
      expect(props.onSetWinner).toHaveBeenCalledWith(11, null, 1)
    })

    it('does nothing when the current winner is selected again', async () => {
      const props = handlers()
      render(<BracketCanvas rounds={rounds} slots={[{ ...filledSlot, winnerTournamentTeamId: 1 }]} teams={teams} {...props} canSetWinner={true} />)
      await userEvent.click(screen.getByRole('button', { name: /vencedor/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Alfa' }))
      expect(props.onSetWinner).not.toHaveBeenCalled()
    })

    it('clears the winner when no-winner is chosen', async () => {
      const props = handlers()
      render(<BracketCanvas rounds={rounds} slots={[{ ...filledSlot, winnerTournamentTeamId: 1 }]} teams={teams} {...props} canSetWinner={true} />)
      await userEvent.click(screen.getByRole('button', { name: /vencedor/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Sem vencedor' }))
      expect(props.onSetWinner).toHaveBeenCalledWith(11, null, null)
    })

    it('confirms before writing on a completed tournament', async () => {
      const props = handlers()
      render(<BracketCanvas rounds={rounds} slots={[filledSlot]} teams={teams} {...props} canSetWinner={true} tournamentStatus="COMPLETED" />)
      await userEvent.click(screen.getByRole('button', { name: /vencedor/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Alfa' }))
      expect(props.onSetWinner).not.toHaveBeenCalled()
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Alterar o vencedor pode reabrir o campeonato e limpar o campeão.')
      await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
      expect(props.onSetWinner).toHaveBeenCalledWith(11, null, 1)
    })

    it('cancels the completed-tournament confirmation without writing', async () => {
      const props = handlers()
      render(<BracketCanvas rounds={rounds} slots={[filledSlot]} teams={teams} {...props} canSetWinner={true} tournamentStatus="COMPLETED" />)
      await userEvent.click(screen.getByRole('button', { name: /vencedor/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Alfa' }))
      await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(props.onSetWinner).not.toHaveBeenCalled()
    })

    it('passes the linked match id along with the winner', async () => {
      const props = handlers()
      const withMatch = { ...filledSlot, match: { id: 501, status: 'FINISHED' as const, date: null, homeScore: null, awayScore: null } }
      render(
        <MemoryRouter>
          <BracketCanvas rounds={rounds} slots={[withMatch]} teams={teams} {...props} canSetWinner={true} />
        </MemoryRouter>,
      )
      await userEvent.click(screen.getByRole('button', { name: /vencedor/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Alfa' }))
      expect(props.onSetWinner).toHaveBeenCalledWith(11, 501, 1)
    })
  })
})
