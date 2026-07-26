import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import * as sportsApi from '../../services/sportsApi'
import type { Tournament } from '../../features/sports/types'
import { TournamentFormPage } from './TournamentFormPage'

const season = { id: 5, label: '2026/27', startDate: '2026-08-01', endDate: '2027-07-31', status: 'ACTIVE' as const }

const tournament: Tournament = {
  id: 12, name: 'Copa de Verão', seasonId: 5, categoryId: null, regulation: null,
  format: 'LEAGUE', status: 'DRAFT', startsAt: null, endsAt: null,
  registrationStartsAt: null, registrationEndsAt: null, isRegistrationOpen: false,
  championTournamentTeamId: null, enrolledTeamCount: 0, matchCount: 0, finishedMatchCount: 0,
  updatedAt: '2026-02-20T18:44:03.117Z',
}

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><TournamentFormPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('TournamentFormPage season field', () => {
  it('asks only for active seasons', async () => {
    const getSeasons = vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(getSeasons).toHaveBeenCalledWith({ status: 'ACTIVE' }))
  })

  it('does not offer creating a season from the tournament form', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    renderPage()
    await screen.findByText('Temporada')
    expect(screen.queryByRole('button', { name: /criar temporada/i })).not.toBeInTheDocument()
  })

  it('still offers creating a category inline', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('button', { name: /criar categoria/i })).toBeInTheDocument()
  })
})

describe('TournamentFormPage status and errors', () => {
  it('cria o campeonato com o status escolhido', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    const spy = vi.spyOn(sportsApi, 'createTournament').mockResolvedValue(tournament)
    renderPage()
    await screen.findByText('Temporada')
    await userEvent.type(screen.getByLabelText('Nome'), 'Copa de Verão')
    await userEvent.click(screen.getByRole('button', { name: 'Criar campeonato' }))
    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 'DRAFT' })))
  })

  it('mostra a mensagem da API quando a temporada não existe', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([season])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([])
    vi.spyOn(sportsApi, 'createTournament').mockRejectedValue(
      Object.assign(new axios.AxiosError('erro'), { response: { data: { error: { code: 'INVALID_REFERENCE' } } } }),
    )
    renderPage()
    await screen.findByText('Temporada')
    await userEvent.type(screen.getByLabelText('Nome'), 'Copa de Verão')
    await userEvent.click(screen.getByRole('button', { name: 'Criar campeonato' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Temporada ou categoria não encontrada')
  })
})
