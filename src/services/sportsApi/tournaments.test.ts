import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import {
  completeTournament,
  createTournament,
  getChampionSuggestion,
  getTournaments,
  listTournamentsPage,
  reopenTournament,
} from './tournaments'

const tournament = {
  id: 12, name: 'Copa de Verão', seasonId: 3, categoryId: 2, regulation: null,
  format: 'GROUP_STAGE_KNOCKOUT', status: 'IN_PROGRESS',
  startsAt: '2026-01-10T00:00:00.000Z', endsAt: '2026-03-15T00:00:00.000Z',
  registrationStartsAt: null, registrationEndsAt: null, isRegistrationOpen: false,
  championTournamentTeamId: null, enrolledTeamCount: 8, matchCount: 14, finishedMatchCount: 9,
  updatedAt: '2026-02-20T18:44:03.117Z',
}

const pageEnvelope = {
  data: [tournament],
  meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
  statusCode: 200,
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
  apiMock.patch.mockReset()
})

describe('tournaments adapter', () => {
  it('desembrulha o envelope paginado para os seletores', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    expect(await getTournaments()).toEqual([tournament])
  })

  it('pede uma única página de 100 quando usado como catálogo', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    await getTournaments()
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments', { params: { page: 1, limit: 100 } })
  })

  it('repassa os filtros da tela de gestão como query params', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    await listTournamentsPage({ page: 2, limit: 20, q: 'copa', seasonId: 3, status: 'IN_PROGRESS' })
    expect(apiMock.get).toHaveBeenCalledWith('/tournaments', {
      params: { page: 2, limit: 20, q: 'copa', seasonId: 3, status: 'IN_PROGRESS' },
    })
  })

  it('devolve o campeonato criado do envelope de escrita', async () => {
    apiMock.post.mockResolvedValue({ data: { data: tournament, statusCode: 201 } })
    expect(await createTournament({ name: 'Copa de Verão', seasonId: 3, format: 'LEAGUE' })).toEqual(tournament)
  })

  it('encerra enviando o id da inscrição campeã', async () => {
    apiMock.post.mockResolvedValue({ data: { data: tournament, statusCode: 200 } })
    await completeTournament({ tournamentId: 12, championTournamentTeamId: 41 })
    expect(apiMock.post).toHaveBeenCalledWith('/tournaments/12/complete', { championTournamentTeamId: 41 })
  })

  it('reabre sem corpo de requisição', async () => {
    apiMock.post.mockResolvedValue({ data: { data: tournament, statusCode: 200 } })
    await reopenTournament({ tournamentId: 12 })
    expect(apiMock.post).toHaveBeenCalledWith('/tournaments/12/reopen')
  })

  it('extrai a sugestão de campeão, que pode ser nula', async () => {
    apiMock.get.mockResolvedValue({ data: { data: { championTournamentTeamId: null }, statusCode: 200 } })
    expect(await getChampionSuggestion(12)).toBeNull()
  })
})
