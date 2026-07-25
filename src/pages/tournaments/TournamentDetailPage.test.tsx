import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TournamentDetailPage } from './TournamentDetailPage'
import * as sportsApi from '../../services/sportsApi'
import { SEED_TOURNAMENT, tournamentTeamId } from '../../features/sports/seedIds'

const { mockIsOrgAdmin } = vi.hoisted(() => ({ mockIsOrgAdmin: vi.fn(() => false) }))
vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => mockIsOrgAdmin() }))

beforeEach(() => {
  vi.spyOn(sportsApi, 'getSeasons').mockResolvedValue([
    { id: 1, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
  ])
  vi.spyOn(sportsApi, 'getCategories').mockResolvedValue([
    { id: 1, name: 'Sub-19', sortOrder: 1, status: 'ACTIVE' },
    { id: 2, name: 'Adulto Masculino', sortOrder: 2, status: 'ACTIVE' },
  ])
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

  it('renders the roster content inside the opened region', async () => {
    await openTeamsTab()
    await userEvent.click(elenco('Time 1'))
    const region = await screen.findByRole('region', { name: 'Elenco Time 1' })
    expect(await within(region).findByText('Rafael Moura')).toBeInTheDocument()
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

  it('adds a roster entry keyed by the enrollment\'s own tournamentTeamId, not the global team id', async () => {
    await openTeamsTab()

    await userEvent.click(screen.getByLabelText('Equipe'))
    await userEvent.click(await screen.findByRole('option', { name: /^Time 9/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Inscrever' }))

    const row = (await within(enrolledList()).findByText('Time 9')).closest('li') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'Elenco' }))
    const region = await screen.findByRole('region', { name: 'Elenco Time 9' })

    await userEvent.click(within(region).getByLabelText('Atleta'))
    await userEvent.click(await screen.findByRole('option', { name: /^Claudio Barbosa/ }))
    await userEvent.type(within(region).getByLabelText('Número'), '4')
    await userEvent.click(within(region).getByRole('button', { name: 'Adicionar ao elenco' }))

    const enrollment = (await sportsApi.getTournamentTeams(2)).find((entry) => entry.teamId === 9)
    await waitFor(async () => {
      const roster = await sportsApi.getRoster(2, enrollment!.id)
      expect(roster.some((entry) => entry.athleteId === 165)).toBe(true)
    })
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
