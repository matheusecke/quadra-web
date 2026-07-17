import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SummaryTab } from './SummaryTab'
import { getAthletes, getMatchDetailById, getTeams } from '../../../features/sports/mock-sports-data'
import { teamMap } from '../../../features/sports/sportsUtils'
import type { MatchDetail } from '../../../features/sports/types'

const baseMatch = getMatchDetailById('puc-geral-m31') as MatchDetail
const athlete = getAthletes().find((candidate) =>
  ![...baseMatch.homeStats.players, ...baseMatch.awayStats.players]
    .some((player) => player.athleteId === candidate.id),
) as NonNullable<ReturnType<typeof getAthletes>[number]>

const renderTab = (match: MatchDetail) =>
  render(
    <MemoryRouter>
      <SummaryTab match={match} teams={teamMap(getTeams())} />
    </MemoryRouter>,
  )

describe('SummaryTab — MVP', () => {
  it('shows the curated MVP when the match has one', () => {
    renderTab({ ...baseMatch, mvp: { tournamentRosterId: 'r1', athleteId: athlete.id } })

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
