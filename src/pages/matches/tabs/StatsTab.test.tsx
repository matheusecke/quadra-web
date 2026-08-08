import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsTab } from './StatsTab'
import type { MatchDetail, PlayerMatchStats } from '../../../features/sports/types'

const line = (over: Partial<PlayerMatchStats>): PlayerMatchStats => ({
  tournamentRosterId: 901, tournamentTeamId: 41, displayName: 'Rafael Moura',
  minutesSeconds: 38 * 60, pts: 24, reb: 5, ast: 6, stl: 2, blk: 0, tov: 2, pf: 2,
  fgm: 9, fga: 17, threeFgm: 2, threeFga: 5, ftm: 4, fta: 5, ...over,
})

const baseMatch: MatchDetail = {
  id: 501,
  tournamentId: 31,
  tournamentGroupId: null,
  matchNumber: 4,
  status: 'FINISHED',
  scheduledAt: '2026-08-01T22:00:00.000Z',
  startedAt: null,
  endedAt: null,
  venueName: 'Quadra 1',
  bracketRound: null,
  scoreSource: 'PERIODS',
  homeTeam: { tournamentTeamId: 41, teamId: 8, teamName: 'Águias', score: 80, result: 'WIN', lossType: null, isWinner: true },
  awayTeam: { tournamentTeamId: 52, teamId: 9, teamName: 'Falcões', score: 75, result: 'LOSS', lossType: null, isWinner: false },
  periods: [],
  playerStats: [
    line({ tournamentRosterId: 901, tournamentTeamId: 41, displayName: 'Rafael Moura' }),
    line({ tournamentRosterId: 902, tournamentTeamId: 52, displayName: 'Diego Santos', reb: null }),
  ],
  mvp: null,
}

describe('StatsTab', () => {
  it('renders stored playing time as MM:SS', () => {
    render(<StatsTab match={baseMatch} />)

    expect(screen.getByText('38:00')).toBeInTheDocument()
  })

  it('labels box score turnovers as TOV', () => {
    render(<StatsTab match={baseMatch} />)

    expect(screen.getByRole('columnheader', { name: 'TOV' })).toBeInTheDocument()
  })

  it('shows N/A for an untracked metric', async () => {
    const user = userEvent.setup()
    render(<StatsTab match={baseMatch} />)

    await user.click(screen.getByRole('button', { name: /visitante/i }))

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('separates players by team so the home roster never shows the away side', () => {
    render(<StatsTab match={baseMatch} />)

    expect(screen.getByText('Rafael Moura')).toBeInTheDocument()
    expect(screen.queryByText('Diego Santos')).not.toBeInTheDocument()
  })

  it('shows an empty state when the match has no recorded stats at all', () => {
    render(<StatsTab match={{ ...baseMatch, playerStats: [] }} />)

    expect(screen.getByText('Estatísticas não disponíveis.')).toBeInTheDocument()
  })
})
