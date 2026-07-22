import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StatsTab } from './StatsTab'
import { getMatchDetailById } from '../../../features/sports/mock-sports-data'
import type { MatchDetail } from '../../../features/sports/types'

const baseMatch = getMatchDetailById(131) as MatchDetail

const tournamentTeams = new Map([
  [baseMatch.homeTournamentTeamId, { name: 'Time 1', shortName: 'T01' }],
  [baseMatch.awayTournamentTeamId, { name: 'Time 2', shortName: 'T02' }],
])

describe('StatsTab', () => {
  it('shows N/A for untracked player, efficiency, and team-total stats', () => {
    const match: MatchDetail = {
      ...baseMatch,
      homeStats: {
        ...baseMatch.homeStats,
        players: baseMatch.homeStats.players.map((player) => ({ ...player, reb: null })),
      },
    }

    render(
      <MemoryRouter>
        <StatsTab match={match} tournamentTeams={tournamentTeams} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('N/A').length).toBeGreaterThan(2)
  })
})
