import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SummaryTab } from './SummaryTab'
import { getMatchDetailById } from '../../../features/sports/mock-sports-data'
import type { Athlete, MatchDetail } from '../../../features/sports/types'

const baseMatch = getMatchDetailById(131) as MatchDetail

const athlete: Athlete = {
  id: 999,
  name: 'Bruno Castro',
  number: 44,
  position: 'C',
  currentTeamId: 1,
  status: 'ACTIVE',
}

const athletes = new Map<number, Athlete>([[athlete.id, athlete]])

const tournamentTeams = new Map([
  [baseMatch.homeTournamentTeamId, { name: 'Time 1', shortName: 'T01' }],
  [baseMatch.awayTournamentTeamId, { name: 'Time 2', shortName: 'T02' }],
])

const renderTab = (match: MatchDetail) =>
  render(
    <MemoryRouter>
      <SummaryTab match={match} tournamentTeams={tournamentTeams} athletes={athletes} />
    </MemoryRouter>,
  )

describe('SummaryTab — MVP', () => {
  it('shows the curated MVP when the match has one', () => {
    renderTab({ ...baseMatch, mvp: { tournamentRosterId: 1, athleteId: athlete.id } })

    expect(screen.getByText(athlete.name)).toBeInTheDocument()
  })

  it('shows no MVP section when the match has none', () => {
    renderTab({ ...baseMatch, mvp: null })

    expect(screen.queryByText(/melhor em quadra/i)).not.toBeInTheDocument()
  })
})

describe('SummaryTab — leaders', () => {
  it('does not elect a leader when a category was never tracked', () => {
    renderTab({
      ...baseMatch,
      homeStats: {
        ...baseMatch.homeStats,
        players: baseMatch.homeStats.players.map((player) => ({ ...player, reb: null })),
      },
      awayStats: {
        ...baseMatch.awayStats,
        players: baseMatch.awayStats.players.map((player) => ({ ...player, reb: null })),
      },
    })

    const rebLeaderCard = screen.getByText('REB').closest('div')?.parentElement
    expect(rebLeaderCard).not.toBeNull()
    expect(rebLeaderCard).not.toHaveTextContent(/^[0-9]+$/)
  })
})
