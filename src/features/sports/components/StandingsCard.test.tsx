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

const renderCard = (env: StandingsEnvelope, isOrgAdmin = true) =>
  render(
    <StandingsCard
      envelope={env}
      teams={teams}
      isOrgAdmin={isOrgAdmin}
      onSetTiebreakOrder={vi.fn().mockResolvedValue(undefined)}
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
})
