import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StandingsCard } from './StandingsCard'
import type { StandingRow, StandingsEnvelope, Team } from '../types'

const teams = new Map<string, Team>([
  ['A', { id: 'A', name: 'Alfa', shortName: 'ALF' }],
  ['B', { id: 'B', name: 'Beta', shortName: 'BET' }],
])

const row = (over: Partial<StandingRow>): StandingRow => ({
  position: 1, tournamentTeamId: 'tt-A', teamId: 'A', teamName: 'Alfa',
  played: 2, wins: 1, losses: 1, classificationPoints: 3,
  pointsFor: 150, pointsAgainst: 150, pointDiff: 0, winPct: 0.5,
  isTiedUnresolved: false, tieBlockKey: null, ...over,
})

const envelope = (over: Partial<StandingsEnvelope>): StandingsEnvelope => ({
  group: { id: 'g1', name: 'Grupo A' }, standingsState: 'FINAL', pendingMatches: 0, rows: [row({})], ...over,
})

const renderCard = (env: StandingsEnvelope, isOrgAdmin = true, onSetTiebreakOrder = vi.fn().mockResolvedValue(undefined)) =>
  render(
    <StandingsCard
      envelope={env}
      teams={teams}
      isOrgAdmin={isOrgAdmin}
      onSetTiebreakOrder={onSetTiebreakOrder}
      onClearTiebreakOrder={vi.fn().mockResolvedValue(undefined)}
    />,
  )

describe('StandingsCard', () => {
  it('says there is no classification yet when EMPTY', () => {
    renderCard(envelope({ standingsState: 'EMPTY', rows: [row({ position: null, played: 0, wins: 0, losses: 0, classificationPoints: 0, winPct: null })] }))
    expect(screen.getByText(/nenhuma partida finalizada/i)).toBeInTheDocument()
  })

  it('says how many matches are missing when PARTIAL', () => {
    renderCard(envelope({ standingsState: 'PARTIAL', pendingMatches: 3 }))
    expect(screen.getByText(/3 jogos ainda não disputados/i)).toBeInTheDocument()
  })

  it('shows no banner when FINAL', () => {
    renderCard(envelope({}))
    expect(screen.queryByText(/classificação parcial/i)).not.toBeInTheDocument()
  })

  it('opens the draw panel for the tied block from the row action', async () => {
    renderCard(envelope({
      rows: [
        row({ isTiedUnresolved: true, tieBlockKey: 'tt-A-tt-B' }),
        row({ teamId: 'B', tournamentTeamId: 'tt-B', teamName: 'Beta', position: 2, isTiedUnresolved: true, tieBlockKey: 'tt-A-tt-B' }),
      ],
    }))
    await userEvent.click(screen.getAllByRole('button', { name: /registrar sorteio/i })[0])
    expect(screen.getByLabelText(/posição de alfa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/posição de beta/i)).toBeInTheDocument()
  })

  it('gives a non-admin no draw affordance at all', () => {
    renderCard(envelope({ rows: [row({ isTiedUnresolved: true, tieBlockKey: 'tt-A-tt-B' })] }), false)
    expect(screen.queryByRole('button', { name: /registrar sorteio/i })).not.toBeInTheDocument()
  })

  // Opening a second block must re-seed the panel: a panel still holding the first block's
  // orders would submit `undefined` positions for teams it has never seen.
  it('records the draw of the block that is open, after switching from another block', async () => {
    const onSetTiebreakOrder = vi.fn().mockResolvedValue(undefined)
    const twoBlocks = envelope({
      rows: [
        row({ isTiedUnresolved: true, tieBlockKey: 'tt-A-tt-B' }),
        row({ teamId: 'B', tournamentTeamId: 'tt-B', teamName: 'Beta', position: 2, isTiedUnresolved: true, tieBlockKey: 'tt-A-tt-B' }),
        row({ teamId: 'C', tournamentTeamId: 'tt-C', teamName: 'Cetus', position: 3, isTiedUnresolved: true, tieBlockKey: 'tt-C-tt-D' }),
        row({ teamId: 'D', tournamentTeamId: 'tt-D', teamName: 'Delta', position: 4, isTiedUnresolved: true, tieBlockKey: 'tt-C-tt-D' }),
      ],
    })
    renderCard(twoBlocks, true, onSetTiebreakOrder)

    const rowButtons = screen.getAllByRole('button', { name: /registrar sorteio/i })
    await userEvent.click(rowButtons[0]) // opens the Alfa/Beta block
    await userEvent.click(rowButtons[2]) // switches to the Cetus/Delta block, without cancelling

    expect(screen.getByLabelText(/posição de cetus/i)).toBeInTheDocument()
    // The panel's own save button is the last one on the page, below the table.
    await userEvent.click(screen.getAllByRole('button', { name: /registrar sorteio/i }).at(-1)!)

    expect(onSetTiebreakOrder).toHaveBeenCalledWith([
      { tournamentTeamId: 'tt-C', order: 1 },
      { tournamentTeamId: 'tt-D', order: 2 },
    ])
  })
})
