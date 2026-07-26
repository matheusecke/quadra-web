import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { TournamentDetailPage } from './TournamentDetailPage'
import * as sportsApi from '../../services/sportsApi'
import { getTournamentById } from '../../features/sports/mock-sports-data'
import { SEED_TOURNAMENT, tournamentTeamId } from '../../features/sports/seedIds'
import type { RosterCandidate, Team, TournamentRoster, TournamentTeam } from '../../features/sports/types'

const { mockIsOrgAdmin } = vi.hoisted(() => ({ mockIsOrgAdmin: vi.fn(() => false) }))
vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => mockIsOrgAdmin() }))

const TEAMS: Team[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({
  id, name: `Time ${id}`, shortName: `T0${id}`, city: 'Campinas',
}))

const CANDIDATES: RosterCandidate[] = [
  { id: 101, name: 'Rafael Moura', teamId: 1, role: 'ATHLETE', jerseyNumber: 4 },
  { id: 165, name: 'Claudio Barbosa', teamId: 9, role: 'ATHLETE', jerseyNumber: 4 },
]

const geralTeams: TournamentTeam[] = [{
  id: tournamentTeamId(SEED_TOURNAMENT.GERAL, 1),
  tournamentId: SEED_TOURNAMENT.GERAL,
  teamId: 1,
  displayNameSnapshot: 'Time 1',
  seed: null,
  tiebreakOrder: null,
  tiebreakBlockKey: null,
}]

const rafaelRoster: TournamentRoster = {
  id: 88,
  tournamentId: SEED_TOURNAMENT.INVERNO,
  tournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 1),
  userId: 101,
  role: 'ATHLETE',
  jerseyNumber: 4,
  displayNameSnapshot: 'Rafael Moura',
}

let invernoTeams: TournamentTeam[]

beforeEach(() => {
  invernoTeams = [1, 2, 3, 4, 5, 6, 7, 8].map((teamId) => ({
    id: tournamentTeamId(SEED_TOURNAMENT.INVERNO, teamId),
    tournamentId: SEED_TOURNAMENT.INVERNO,
    teamId,
    displayNameSnapshot: `Time ${teamId}`,
    seed: null,
    tiebreakOrder: null,
    tiebreakBlockKey: null,
  }))

  vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([
    { id: 1, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
  ])
  vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([
    { id: 1, name: 'Sub-19', sortOrder: 1, status: 'ACTIVE' },
    { id: 2, name: 'Adulto Masculino', sortOrder: 2, status: 'ACTIVE' },
  ])
  // getTournament now hits the real API; these tests still read the seeded demo data.
  vi.spyOn(sportsApi, 'getTournament').mockImplementation(async (id) => getTournamentById(id)!)
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(TEAMS)
  vi.spyOn(sportsApi, 'searchTeams').mockImplementation(async (q) =>
    TEAMS.filter((team) => team.name.toLowerCase().includes(q.toLowerCase())))
  vi.spyOn(sportsApi, 'getTournamentTeams').mockImplementation(async (id) =>
    id === SEED_TOURNAMENT.INVERNO ? invernoTeams : geralTeams)
  vi.spyOn(sportsApi, 'enrollTeam').mockImplementation(async ({ tournamentId, teamId }) => {
    const team = TEAMS.find((candidate) => candidate.id === teamId)!
    const entry: TournamentTeam = {
      id: tournamentTeamId(tournamentId, teamId),
      tournamentId,
      teamId,
      displayNameSnapshot: team.name,
      seed: null,
      tiebreakOrder: null,
      tiebreakBlockKey: null,
    }
    if (tournamentId === SEED_TOURNAMENT.INVERNO) invernoTeams = [...invernoTeams, entry]
    return entry
  })
  vi.spyOn(sportsApi, 'getTournamentRoster').mockImplementation(async (ttId) =>
    ttId === tournamentTeamId(SEED_TOURNAMENT.INVERNO, 1) ? [rafaelRoster] : [])
  vi.spyOn(sportsApi, 'searchRosterCandidates').mockImplementation(async ({ q, teamId, role }) =>
    CANDIDATES.filter((candidate) =>
      candidate.teamId === teamId && candidate.role === role && (!q || candidate.name.toLowerCase().includes(q.toLowerCase()))))
  vi.spyOn(sportsApi, 'addTournamentRoster').mockResolvedValue({
    id: 999,
    tournamentId: SEED_TOURNAMENT.INVERNO,
    tournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 9),
    userId: 165,
    role: 'ATHLETE',
    jerseyNumber: 4,
    displayNameSnapshot: 'Claudio Barbosa',
  })
})

const renderDetail = (id: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/tournaments/${id}`]}>
        <Routes>
          <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="loc">{location.search}</div>
}

const renderDetailAt = (path: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TournamentDetailPage info strip', () => {
  it('does not show a current phase — the phase left the screen by decision (DB spec §6.3)', async () => {
    mockIsOrgAdmin.mockReturnValue(false)
    renderDetail('1')

    await waitFor(() => expect(screen.getByText(/campeonato geral/i)).toBeInTheDocument())

    expect(screen.queryByText(/fase atual/i)).not.toBeInTheDocument()
  })

  it('anuncia a inscrição aberta apenas quando a janela está valendo', async () => {
    mockIsOrgAdmin.mockReturnValue(false)
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue({
      ...getTournamentById(1)!, isRegistrationOpen: true, status: 'REGISTRATION',
    })
    renderDetail('1')
    expect(await screen.findByText('Abertas')).toBeInTheDocument()
  })
})

describe('TournamentDetailPage complete errors', () => {
  it('explica a recusa da API ao encerrar sem campeão', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue({
      ...getTournamentById(1)!, status: 'IN_PROGRESS', format: 'GROUP_STAGE',
    })
    vi.spyOn(sportsApi, 'completeTournament').mockRejectedValue(
      Object.assign(new axios.AxiosError('erro'), { response: { data: { error: { code: 'CHAMPION_REQUIRED' } } } }),
    )
    renderDetail('1')
    await userEvent.click(await screen.findByRole('button', { name: 'Encerrar campeonato' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar encerramento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione a equipe campeã.')
  })
})

describe('TournamentDetailPage inline roster (org admin)', () => {
  const enrolledList = () => screen.getByRole('list', { name: 'Equipes inscritas' })
  const teamRow = (name: string) =>
    within(enrolledList()).getByText(name).closest('li') as HTMLElement
  const elenco = (name: string) =>
    within(teamRow(name)).getByRole('button', { name: 'Elenco' })

  const openTeamsTab = async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('2')
    await screen.findByText('Copa de Inverno PUC')
    await userEvent.click(screen.getByRole('tab', { name: 'Equipes' }))
    await screen.findByRole('list', { name: 'Equipes inscritas' })
  }

  it('opens the roster editor inside the clicked team row', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    const region = await screen.findByRole('region', { name: 'Elenco Time 1' })
    expect(teamRow('Time 1')).toContainElement(region)
  })

  it('places the editor before the following team in DOM order', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    const region = await screen.findByRole('region', { name: 'Elenco Time 1' })
    const positionOfTime2 = region.compareDocumentPosition(teamRow('Time 2'))
    expect(positionOfTime2 & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders exactly one open editor region', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    await screen.findByRole('region', { name: 'Elenco Time 1' })
    expect(screen.getAllByRole('region', { name: /^Elenco / })).toHaveLength(1)
  })

  it('collapses the editor when the same team is clicked again', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    await screen.findByRole('region', { name: 'Elenco Time 1' })
    await userEvent.click(elenco('Time 1'))
    expect(screen.queryByRole('region', { name: 'Elenco Time 1' })).toBeNull()
  })

  it('closes Time 1 when Time 2 is opened', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    await screen.findByRole('region', { name: 'Elenco Time 1' })
    await userEvent.click(elenco('Time 2'))
    await screen.findByRole('region', { name: 'Elenco Time 2' })
    expect(screen.queryByRole('region', { name: 'Elenco Time 1' })).toBeNull()
  })

  it('renders the roster content from the server snapshot, not the athlete catalog', async () => {
    const getAthletes = vi.spyOn(sportsApi, 'getAthletes')
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    const region = await screen.findByRole('region', { name: 'Elenco Time 1' })
    expect(await within(region).findByText('Rafael Moura')).toBeInTheDocument()
    expect(getAthletes).not.toHaveBeenCalled()
  })

  it('renders the enrollment snapshot instead of the current team name', async () => {
    invernoTeams[0] = { ...invernoTeams[0], displayNameSnapshot: 'Nome histórico' }
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('2')
    await screen.findByText('Copa de Inverno PUC')
    await userEvent.click(screen.getByRole('tab', { name: 'Equipes' }))

    expect(await within(enrolledList()).findByText('Nome histórico')).toBeInTheDocument()
    expect(within(enrolledList()).queryByText('Time 1')).not.toBeInTheDocument()
  })

  it('marks the Elenco control expanded when open', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    await screen.findByRole('region', { name: 'Elenco Time 1' })
    expect(elenco('Time 1')).toHaveAttribute('aria-expanded', 'true')
  })

  it('wires the Elenco control to its panel via aria-controls, keyed by the enrollment id', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    await screen.findByRole('region', { name: 'Elenco Time 1' })
    expect(elenco('Time 1')).toHaveAttribute(
      'aria-controls',
      `roster-panel-${tournamentTeamId(SEED_TOURNAMENT.INVERNO, 1)}`,
    )
  })

  it('enrolls a team and adds a roster member using API identities, not local mock ids', async () => {
    await openTeamsTab()

    await userEvent.type(screen.getByRole('combobox'), 'Time 9')
    await userEvent.click(await screen.findByRole('option', { name: /^Time 9/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Inscrever' }))

    expect(sportsApi.searchTeams).toHaveBeenCalledWith('Time 9')
    expect(sportsApi.enrollTeam).toHaveBeenCalledWith({ tournamentId: 2, teamId: 9 })

    const row = (await within(enrolledList()).findByText('Time 9')).closest('li') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'Elenco' }))
    const region = await screen.findByRole('region', { name: 'Elenco Time 9' })

    await userEvent.type(within(region).getByRole('combobox'), 'Claudio')
    await userEvent.click(await screen.findByRole('option', { name: /^Claudio Barbosa/ }))
    await userEvent.type(within(region).getByLabelText('Número'), '4')
    await userEvent.click(within(region).getByRole('button', { name: 'Adicionar ao elenco' }))

    expect(sportsApi.searchRosterCandidates).toHaveBeenCalledWith({ q: 'Claudio', teamId: 9, role: 'ATHLETE' })
    expect(sportsApi.addTournamentRoster).toHaveBeenCalledWith({
      userId: 165,
      tournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 9),
      role: 'ATHLETE',
      jerseyNumber: 4,
    })
  })

  it('shows the mapped message when enrollment is rejected as a duplicate', async () => {
    vi.spyOn(sportsApi, 'enrollTeam').mockRejectedValue(
      Object.assign(new axios.AxiosError('erro'), { response: { data: { error: { code: 'DUPLICATE_RECORD' } } } }),
    )
    await openTeamsTab()
    await userEvent.type(screen.getByRole('combobox'), 'Time 9')
    await userEvent.click(await screen.findByRole('option', { name: /^Time 9/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Inscrever' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Equipe já inscrita neste campeonato.')
  })

  it('requires inline confirmation before removing an enrolled team', async () => {
    await openTeamsTab()
    const row = teamRow('Time 1')
    await userEvent.click(within(row).getByRole('button', { name: 'Remover' }))

    expect(within(row).getByText('Remover Time 1 do campeonato?')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('cancels the enrolled-team removal confirmation', async () => {
    await openTeamsTab()
    const row = teamRow('Time 1')
    await userEvent.click(within(row).getByRole('button', { name: 'Remover' }))
    await userEvent.click(within(row).getByRole('button', { name: 'Cancelar' }))

    expect(within(row).getByRole('button', { name: 'Remover' })).toBeInTheDocument()
    expect(screen.queryByText('Remover Time 1 do campeonato?')).not.toBeInTheDocument()
  })

  it('keeps team removal confirmation open and shows the mapped API error', async () => {
    vi.spyOn(sportsApi, 'removeTournamentTeam').mockRejectedValue(
      Object.assign(new axios.AxiosError('erro'), { response: { data: { error: { code: 'REGISTRATION_IN_USE' } } } }),
    )
    await openTeamsTab()
    const row = teamRow('Time 1')
    await userEvent.click(within(row).getByRole('button', { name: 'Remover' }))
    await userEvent.click(within(row).getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A inscrição já está em uso pelo chaveamento.')
    expect(within(row).getByText('Remover Time 1 do campeonato?')).toBeInTheDocument()
  })

  it('keeps roster removal confirmation open and shows the mapped API error', async () => {
    vi.spyOn(sportsApi, 'removeTournamentRoster').mockRejectedValue(
      Object.assign(new axios.AxiosError('erro'), { response: { data: { error: { code: 'INACTIVE_REGISTRATION' } } } }),
    )
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    const region = await screen.findByRole('region', { name: 'Elenco Time 1' })
    await userEvent.click(within(region).getByRole('button', { name: 'Remover' }))
    await userEvent.click(within(region).getByRole('button', { name: 'Confirmar' }))

    expect(await within(region).findByRole('alert')).toHaveTextContent('A inscrição ou o membro não está ativo.')
    expect(within(region).getByText('Remover Rafael Moura do elenco neste campeonato?')).toBeInTheDocument()
  })
})

describe('TournamentDetailPage registration query state', () => {
  it('blocks enrollment controls when registrations cannot be loaded', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    vi.spyOn(sportsApi, 'getTournamentTeams').mockRejectedValue(new Error('registrations unavailable'))
    renderDetail('2')

    expect(await screen.findByText('Não foi possível carregar o campeonato.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inscrever' })).not.toBeInTheDocument()
  })
})

describe('TournamentDetailPage champion band', () => {
  it('labels the champion to a non-admin on a completed tournament', async () => {
    mockIsOrgAdmin.mockReturnValue(false)
    renderDetail('1')
    expect(await screen.findByText('Campeão')).toBeInTheDocument()
  })

  it('shows the champion team name on a completed tournament', async () => {
    mockIsOrgAdmin.mockReturnValue(false)
    renderDetail('1')
    const championLabel = await screen.findByText('Campeão')
    expect(within(championLabel.parentElement!).getByText('Time 1')).toBeInTheDocument()
  })

  it('shows no champion on a tournament that is not completed', async () => {
    mockIsOrgAdmin.mockReturnValue(false)
    renderDetail('2')
    await screen.findByText('Copa de Inverno PUC')
    expect(screen.queryByText('Campeão')).not.toBeInTheDocument()
  })
})

describe('TournamentDetailPage admin region', () => {
  const region = () => screen.getByRole('region', { name: 'Administração' })

  it('offers reopen on a completed tournament', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('1')
    await screen.findByText('Campeonato Geral da PUC 2026')
    expect(within(region()).getByRole('button', { name: 'Reabrir campeonato' })).toBeInTheDocument()
  })

  it('does not offer complete on a completed tournament', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('1')
    await screen.findByText('Campeonato Geral da PUC 2026')
    expect(within(region()).queryByRole('button', { name: 'Encerrar campeonato' })).not.toBeInTheDocument()
  })

  it('offers only edit on a tournament that is neither in progress nor completed', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('2')
    await screen.findByText('Copa de Inverno PUC')
    expect(within(region()).queryByRole('button', { name: 'Reabrir campeonato' })).not.toBeInTheDocument()
  })

  it('reveals the reopen confirmation when reopen is clicked', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('1')
    await screen.findByText('Campeonato Geral da PUC 2026')
    await userEvent.click(within(region()).getByRole('button', { name: 'Reabrir campeonato' }))
    expect(screen.getByRole('button', { name: 'Confirmar reabertura' })).toBeInTheDocument()
  })

  it('keeps the tournament completed until reopen is confirmed', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('1')
    await screen.findByText('Campeonato Geral da PUC 2026')
    await userEvent.click(within(region()).getByRole('button', { name: 'Reabrir campeonato' }))
    expect(screen.getByText('Encerrado')).toBeInTheDocument()
  })

  it('hides the reopen confirmation on cancel', async () => {
    mockIsOrgAdmin.mockReturnValue(true)
    renderDetail('1')
    await screen.findByText('Campeonato Geral da PUC 2026')
    await userEvent.click(within(region()).getByRole('button', { name: 'Reabrir campeonato' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('button', { name: 'Confirmar reabertura' })).not.toBeInTheDocument()
  })
})

describe('TournamentDetailPage metadata', () => {
  it('renders metadata from the queried season and category catalogs', async () => {
    vi.spyOn(sportsApi, 'getSeasons').mockResolvedValueOnce([
      { id: 1, label: 'Temporada via seam', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
    ])
    vi.spyOn(sportsApi, 'getCategories').mockResolvedValueOnce([
      { id: 2, name: 'Categoria via seam', sortOrder: 1, status: 'ACTIVE' },
    ])
    renderDetail('1')
    expect(await screen.findByText('Temporada via seam')).toBeInTheDocument()
    expect(screen.getByText('Categoria via seam')).toBeInTheDocument()
  })
})

describe('TournamentDetailPage tab query param', () => {
  it('opens the Partidas tab from the tab query param on first paint', async () => {
    mockIsOrgAdmin.mockReturnValue(false)
    renderDetailAt('/tournaments/2?tab=matches')

    expect(await screen.findByRole('tab', { name: 'Partidas', selected: true })).toBeInTheDocument()
  })

  it('reflects the selected tab in the URL when switching tabs', async () => {
    mockIsOrgAdmin.mockReturnValue(false)
    renderDetailAt('/tournaments/2')
    await screen.findByText('Copa de Inverno PUC')

    await userEvent.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.getByTestId('loc')).toHaveTextContent('tab=matches')
  })
})
