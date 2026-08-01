import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryTab } from './SummaryTab'
import type { MatchDetail } from '../../../features/sports/types'

const baseMatch: MatchDetail = {
  id: 501,
  tournamentId: 31,
  tournamentGroupId: null,
  matchNumber: 4,
  status: 'FINISHED',
  scheduledAt: '2026-08-01T22:00:00.000Z',
  startedAt: '2026-08-01T22:05:00.000Z',
  endedAt: '2026-08-01T23:40:00.000Z',
  venueName: 'Quadra 1',
  bracketRound: null,
  scoreSource: 'PERIODS',
  homeTeam: { tournamentTeamId: 41, teamName: 'Águias', score: 80, result: 'WIN', lossType: null, isWinner: true },
  awayTeam: { tournamentTeamId: 52, teamName: 'Falcões', score: 75, result: 'LOSS', lossType: null, isWinner: false },
  periods: [
    { periodNumber: 2, periodType: 'REGULAR', homePoints: 22, awayPoints: 19, startedAt: null, endedAt: null },
    { periodNumber: 1, periodType: 'REGULAR', homePoints: 20, awayPoints: 18, startedAt: null, endedAt: null },
    { periodNumber: 1, periodType: 'OVERTIME', homePoints: 8, awayPoints: 6, startedAt: null, endedAt: null },
  ],
  playerStats: [],
  mvp: { tournamentRosterId: 901, displayName: 'Rafael Moura' },
}

describe('SummaryTab', () => {
  it('shows the curated MVP as plain text, not a link', () => {
    render(<SummaryTab match={baseMatch} />)

    expect(screen.getByText('Rafael Moura')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Rafael Moura' })).not.toBeInTheDocument()
  })

  it('shows no MVP section when the match has none', () => {
    render(<SummaryTab match={{ ...baseMatch, mvp: null }} />)

    expect(screen.queryByText(/melhor em quadra/i)).not.toBeInTheDocument()
  })

  it('renders period columns in the order the backend returned them', () => {
    render(<SummaryTab match={baseMatch} />)

    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent)
    expect(headers).toEqual(['Equipe', '2Q', '1Q', 'OT', 'Total'])
  })

  it('renders no period table when the match has no periods', () => {
    render(<SummaryTab match={{ ...baseMatch, periods: [] }} />)

    expect(screen.queryByText('Placar por período')).not.toBeInTheDocument()
  })
})
