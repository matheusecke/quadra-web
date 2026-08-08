import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Tournament, MatchSummary } from '../../../features/sports/types'
import { MatchesTab } from './MatchesTab'

const tournament: Tournament = {
  id: 1,
  name: 'Supercopa Nacional',
  seasonId: 1,
  categoryId: 2,
  regulation: 'Todos contra todos.',
  format: 'GROUP_STAGE_KNOCKOUT',
  status: 'IN_PROGRESS',
  startsAt: '2026-06-01T00:00:00.000Z',
  endsAt: '2026-06-30T00:00:00.000Z',
  registrationStartsAt: null,
  registrationEndsAt: null,
  isRegistrationOpen: false,
  championTournamentTeamId: null,
  enrolledTeamCount: 4,
  matchCount: 2,
  finishedMatchCount: 1,
  updatedAt: '2026-06-10T12:00:00.000Z',
}

const matches: MatchSummary[] = [
  {
    id: 101,
    tournamentId: 1,
    tournamentGroupId: null,
    matchNumber: null,
    status: 'FINISHED',
    scheduledAt: '2026-06-07T21:00:00.000Z',
    startedAt: null,
    endedAt: null,
    venueName: 'Ginásio Central',
    bracketRound: { id: 11, number: 1, label: 'Oitavas de final' },
    scoreSource: 'PERIODS',
    homeTeam: { tournamentTeamId: 1001, teamId: 1, teamName: 'Abutres', score: 77, result: 'WIN', lossType: null, isWinner: true },
    awayTeam: { tournamentTeamId: 1002, teamId: 2, teamName: 'Águias Douradas', score: 74, result: 'LOSS', lossType: 'NORMAL', isWinner: false },
  },
  {
    id: 102,
    tournamentId: 1,
    tournamentGroupId: null,
    matchNumber: null,
    status: 'SCHEDULED',
    scheduledAt: '2026-06-14T20:00:00.000Z',
    startedAt: null,
    endedAt: null,
    venueName: 'Arena Metropolitana',
    bracketRound: { id: 12, number: 2, label: 'Semifinais' },
    scoreSource: null,
    homeTeam: { tournamentTeamId: 1003, teamId: 3, teamName: 'Linces', score: null, result: null, lossType: null, isWinner: null },
    awayTeam: { tournamentTeamId: 1004, teamId: 4, teamName: 'Lobos do Norte', score: null, result: null, lossType: null, isWinner: null },
  },
]

function renderTab(props: Partial<Parameters<typeof MatchesTab>[0]> = {}) {
  return render(
    <MemoryRouter>
      <MatchesTab
        tournament={tournament}
        matches={matches}
        isPending={false}
        isError={false}
        onRetry={vi.fn()}
        isOrgAdmin={false}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('MatchesTab', () => {
  it('renders matches with inline matchup scores and no statistics status labels', () => {
    renderTab()

    expect(screen.getByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
    expect(screen.getByLabelText('Linces vs Lobos do Norte')).toBeInTheDocument()

    expect(screen.queryByRole('columnheader', { name: 'Mandante' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Visitante' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Placar' })).not.toBeInTheDocument()

    const finishedRow = screen.getByLabelText('Abutres 77 - 74 Águias Douradas').closest('tr')
    expect(finishedRow).not.toBeNull()
    expect(within(finishedRow as HTMLTableRowElement).getByText('Oitavas de final')).toBeInTheDocument()
    expect(within(finishedRow as HTMLTableRowElement).getByText('Finalizada')).toBeInTheDocument()

    const scheduledRow = screen.getByLabelText('Linces vs Lobos do Norte').closest('tr')
    expect(scheduledRow).not.toBeNull()
    expect(within(scheduledRow as HTMLTableRowElement).getByText('Agendada')).toBeInTheDocument()
  })

  it('filters matches by the enrolled team\'s own tournamentTeamId', async () => {
    renderTab()

    await userEvent.click(screen.getByLabelText('Filtrar por equipe'))
    await userEvent.click(await screen.findByRole('option', { name: 'Linces' }))

    expect(screen.getByLabelText('Linces vs Lobos do Norte')).toBeInTheDocument()
    expect(screen.queryByLabelText('Abutres 77 - 74 Águias Douradas')).not.toBeInTheDocument()
  })

  it('links each matchup to the match detail page', () => {
    renderTab()

    expect(screen.getByRole('link', { name: 'Abutres 77 - 74 Águias Douradas' })).toHaveAttribute(
      'href',
      '/matches/101',
    )
    expect(screen.getByRole('link', { name: 'Linces vs Lobos do Norte' })).toHaveAttribute('href', '/matches/102')
  })

  it('does not blame the filters when the championship simply has no matches', () => {
    renderTab({ matches: [] })

    expect(screen.getByText('Nenhuma partida agendada.')).toBeInTheDocument()
  })

  it('points at the filters when they are what hid every match', async () => {
    renderTab()

    await userEvent.type(screen.getByLabelText('Buscar partida por equipe'), 'zzz')

    expect(screen.getByText('Nenhuma partida encontrada com os filtros atuais.')).toBeInTheDocument()
  })

  it('shows a skeleton while matches are loading', () => {
    renderTab({ isPending: true })

    expect(screen.queryByLabelText('Abutres 77 - 74 Águias Douradas')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows an error state with retry when matches fail to load', async () => {
    const onRetry = vi.fn()
    renderTab({ isError: true, onRetry })

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('MatchesTab creation action', () => {
  it('opens the scheduling form for org admins with the championship locked in', async () => {
    render(
      <MemoryRouter initialEntries={['/tournaments/1']}>
        <Routes>
          <Route
            path="/tournaments/1"
            element={
              <MatchesTab
                tournament={tournament}
                matches={matches}
                isPending={false}
                isError={false}
                onRetry={vi.fn()}
                isOrgAdmin
              />
            }
          />
          <Route path="/tournaments/1/matches/new" element={<div>formulário de nova partida</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Nova partida' }))

    expect(screen.getByText('formulário de nova partida')).toBeInTheDocument()
  })

  it('hides the creation action from non-admins', () => {
    renderTab()

    expect(screen.queryByRole('button', { name: 'Nova partida' })).not.toBeInTheDocument()
  })
})
