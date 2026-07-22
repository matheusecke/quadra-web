import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Tournament } from '../../../features/sports/types'
import { describe, expect, it, vi } from 'vitest'
import * as sportsApi from '../../../services/sportsApi'
import { tournamentTeamId } from '../../../features/sports/seedIds'

import { BracketTab } from './BracketTab'

const isOrgAdmin = vi.hoisted(() => ({ value: false }))
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => isOrgAdmin.value }))

const empty = { id: 999, name: 'Copa', format: 'KNOCKOUT', teamIds: [] } as unknown as Tournament
const demo = { id: 1, name: 'Geral', format: 'KNOCKOUT', teamIds: [] } as unknown as Tournament

const renderTab = (tournament: Tournament) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <BracketTab tournament={tournament} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('BracketTab', () => {
  it('shows an empty state before any slot exists', async () => {
    isOrgAdmin.value = false
    renderTab(empty)
    await waitFor(() =>
      expect(screen.getByText('Chaveamento ainda não montado.')).toBeInTheDocument(),
    )
  })

  it('renders no control that writes for a reader', async () => {
    isOrgAdmin.value = false
    renderTab(demo)
    await waitFor(() => expect(screen.getByText('Quartas de final')).toBeInTheDocument())
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers the round control to an admin', async () => {
    isOrgAdmin.value = true
    renderTab(demo)
    await waitFor(() => expect(screen.getByRole('button', { name: /nova rodada/i })).toBeInTheDocument())
  })

  it('schedules a filled slot using its own tournamentTeamId directly, not a re-derived global id', async () => {
    isOrgAdmin.value = true
    renderTab(demo)

    await userEvent.click(await screen.findByRole('button', { name: /nova rodada/i }))
    const newRound = (await screen.findByRole('heading', { name: 'Rodada 4' })).closest('div') as HTMLElement
    await userEvent.click(within(newRound).getByRole('button', { name: /adicionar partida/i }))

    await userEvent.click(await screen.findByRole('button', { name: /mandante/i }))
    await userEvent.click(await screen.findByRole('option', { name: /^Time 15/ }))
    await userEvent.click(screen.getByRole('button', { name: /visitante/i }))
    await userEvent.click(await screen.findByRole('option', { name: /^Time 16/ }))

    await userEvent.click(await screen.findByRole('button', { name: /agendar/i }))
    fireEvent.change(screen.getByLabelText(/data e hora/i), { target: { value: '12/08/2026 19:00' } })
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))

    const link = await screen.findByRole('link', { name: /lançar súmula/i })
    const matchId = Number(link.getAttribute('href')?.match(/\/matches\/(\d+)/)?.[1])
    const detail = await sportsApi.getMatchDetail(matchId)
    expect(detail?.homeTournamentTeamId).toBe(tournamentTeamId(1, 15))
    expect(detail?.awayTournamentTeamId).toBe(tournamentTeamId(1, 16))
  })
})
