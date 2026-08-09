import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrgUsersPage } from './OrgUsersPage'

const useAuthMock = vi.fn()
const listOrgUsersMock = vi.fn()
const listOrgTeamsMock = vi.fn()
const activeAffiliationMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../services/orgApi', () => ({
  listOrgUsers: (...args: unknown[]) => listOrgUsersMock(...args),
  listOrgTeams: (...args: unknown[]) => listOrgTeamsMock(...args),
  lookupUserByEmail: vi.fn(),
  inviteOrgAdmin: vi.fn(),
  inviteTeamMember: vi.fn(),
}))

vi.mock('../../hooks/useActiveOrgAffiliation', () => ({
  useActiveOrgAffiliation: () => activeAffiliationMock(),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <OrgUsersPage />
    </QueryClientProvider>,
  )
}

describe('OrgUsersPage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      user: {
        id: 9,
        email: 'admin@liga.test',
        name: 'Admin Liga',
        isSystemAdmin: false,
        organizationId: 42,
        role: 'ORG_ADMIN',
      },
      organizations: [
        {
          organizationId: 42,
          organizationName: 'Liga Central',
          organizationSlug: 'liga-central',
          role: 'ORG_ADMIN',
          teamId: null,
        },
      ],
    })

    activeAffiliationMock.mockReturnValue({ role: 'ORG_ADMIN', teamId: null })

    listOrgTeamsMock.mockReset()
    listOrgTeamsMock.mockResolvedValue({
      data: [
        {
          id: 3,
          organizationId: 42,
          teamId: 8,
          team: { id: 8, name: 'Tigres', shortName: 'TIG', city: null, state: null },
          status: 'ACTIVE',
          activeUserCount: 1,
          pendingAdminInviteCount: 0,
          createdByUserId: 9,
          createdAt: '2026-06-01T12:00:00.000Z',
          updatedAt: '2026-06-01T12:00:00.000Z',
        },
      ],
      meta: { totalItems: 1, itemCount: 1, itemsPerPage: 100, totalPages: 1, currentPage: 1 },
      links: { first: '', previous: null, next: null, last: '' },
      statusCode: 200,
    })

    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockResolvedValue({
      data: [
        {
          id: 1,
          userId: 12,
          user: {
            id: 12,
            name: 'Ana Costa',
            email: 'ana@liga.test',
          },
          organizationId: 42,
          role: 'ATHLETE',
          teamId: 8,
          team: {
            id: 8,
            name: 'Tigres',
          },
          jerseyNumber: 23,
          position: 'PG',
          inviteExpiresAt: null,
          isInviteExpired: false,
          canManage: true,
          status: 'ACTIVE',
          createdByUserId: 9,
          createdAt: '2026-06-01T12:00:00.000Z',
          updatedAt: '2026-06-01T12:00:00.000Z',
        },
      ],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 20,
        totalPages: 1,
        currentPage: 1,
      },
      links: {
        first: '',
        previous: null,
        next: null,
        last: '',
      },
      statusCode: 200,
    })
  })

  it('renders the active organization user list and queries it without orgId in the call shape', async () => {
    renderPage()

    const heading = await screen.findByRole('heading', { name: 'Usuários' })
    const pageHeader = heading.closest('div')?.parentElement?.parentElement

    expect(heading).toBeInTheDocument()
    expect(await screen.findByText('Ana Costa')).toBeInTheDocument()
    expect(screen.getByText('ana@liga.test')).toBeInTheDocument()
    expect(screen.getByText('Atleta')).toBeInTheDocument()
    expect(screen.getByText('Tigres')).toBeInTheDocument()
    expect(screen.getByText('#23 · PG')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(pageHeader).toContainElement(screen.getByLabelText('Buscar usuários da organização'))
    expect(pageHeader).toContainElement(screen.getByLabelText('Filtrar usuários por status'))
    expect(pageHeader).toContainElement(screen.getByLabelText('Filtrar usuários por papel'))
    expect(listOrgUsersMock).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: undefined,
      status: undefined,
      role: undefined,
      teamId: undefined,
    })
  })

  it('renders skeleton rows while the list query is still loading', () => {
    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('renders an empty state when the organization has no users to show', async () => {
    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockResolvedValue({
      data: [],
      meta: {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 20,
        totalPages: 1,
        currentPage: 1,
      },
      links: {
        first: '',
        previous: null,
        next: null,
        last: '',
      },
      statusCode: 200,
    })

    renderPage()

    expect(await screen.findByText('Nenhum usuário encontrado nesta organização.')).toBeInTheDocument()
  })

  it('renders a generic error state and retries the query on demand', async () => {
    const user = userEvent.setup()

    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockRejectedValue(new Error('network'))

    renderPage()

    expect(
      await screen.findByText('Não foi possível carregar os usuários desta organização.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(listOrgUsersMock).toHaveBeenCalledTimes(2)
  })

  it('renders the authorization-specific copy for 403 responses', async () => {
    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 403,
      },
    })

    renderPage()

    expect(
      await screen.findByText(
        'Seu papel atual não permite carregar a lista de usuários desta organização.',
      ),
    ).toBeInTheDocument()
  })

  it('applies search, status and role filters without introducing orgId into the API call', async () => {
    const user = userEvent.setup()

    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockResolvedValue({
      data: [],
      meta: {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 20,
        totalPages: 1,
        currentPage: 1,
      },
      links: {
        first: '',
        previous: null,
        next: null,
        last: '',
      },
      statusCode: 200,
    })

    renderPage()
    await screen.findByRole('heading', { name: 'Usuários' })

    await user.type(screen.getByLabelText('Buscar usuários da organização'), 'ana')
    await user.click(screen.getByLabelText('Filtrar usuários por status'))
    await user.click(screen.getByRole('option', { name: 'Ativo' }))
    await user.click(screen.getByLabelText('Filtrar usuários por papel'))
    await user.click(screen.getByRole('option', { name: 'Atleta' }))

    await waitFor(() => {
      expect(listOrgUsersMock).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        q: 'ana',
        status: 'ACTIVE',
        role: 'ATHLETE',
        teamId: undefined,
      })
    })
  })

  it('translates the role filter options into the contractual labels', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Usuários' })

    await user.click(screen.getByLabelText('Filtrar usuários por papel'))

    expect(screen.getByRole('option', { name: 'Administrador da equipe' })).toBeInTheDocument()
  })

  it('sends the selected team to the user list query', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Usuários' })

    await user.click(await screen.findByLabelText('Filtrar usuários por equipe'))
    await user.click(await screen.findByRole('option', { name: 'Tigres' }))

    await waitFor(() => {
      expect(listOrgUsersMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ teamId: 8 }),
      )
    })
  })

  it('hides the team filter from a team administrator', async () => {
    activeAffiliationMock.mockReturnValue({ role: 'TEAM_ADMIN', teamId: 8 })

    renderPage()
    await screen.findByRole('heading', { name: 'Usuários' })

    expect(screen.queryByLabelText('Filtrar usuários por equipe')).not.toBeInTheDocument()
  })

  it('never widens the scope of a team administrator with a teamId parameter', async () => {
    activeAffiliationMock.mockReturnValue({ role: 'TEAM_ADMIN', teamId: 8 })

    renderPage()
    await screen.findByRole('heading', { name: 'Usuários' })

    await waitFor(() => {
      expect(listOrgUsersMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ teamId: undefined }),
      )
    })
  })

  it('derives the expired status from the invite metadata', async () => {
    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockResolvedValue({
      data: [
        {
          id: 2,
          userId: 13,
          user: { id: 13, name: 'Bruno Lima', email: 'bruno@liga.test' },
          organizationId: 42,
          role: 'TEAM_ADMIN',
          teamId: 8,
          team: { id: 8, name: 'Tigres' },
          jerseyNumber: null,
          position: null,
          status: 'PENDING',
          inviteExpiresAt: '2026-07-01T12:00:00.000Z',
          isInviteExpired: true,
          canManage: true,
          createdByUserId: 9,
          createdAt: '2026-06-01T12:00:00.000Z',
          updatedAt: '2026-06-01T12:00:00.000Z',
        },
      ],
      meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
      links: { first: '', previous: null, next: null, last: '' },
      statusCode: 200,
    })

    renderPage()

    expect(await screen.findByText('Expirado')).toBeInTheDocument()
  })

  it('renders a dash when the affiliation has neither jersey nor position', async () => {
    listOrgUsersMock.mockReset()
    listOrgUsersMock.mockResolvedValue({
      data: [
        {
          id: 3,
          userId: 14,
          user: { id: 14, name: 'Carla Reis', email: 'carla@liga.test' },
          organizationId: 42,
          role: 'ORG_ADMIN',
          teamId: null,
          team: null,
          jerseyNumber: null,
          position: null,
          status: 'ACTIVE',
          inviteExpiresAt: null,
          isInviteExpired: false,
          canManage: false,
          createdByUserId: 9,
          createdAt: '2026-06-01T12:00:00.000Z',
          updatedAt: '2026-06-01T12:00:00.000Z',
        },
      ],
      meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
      links: { first: '', previous: null, next: null, last: '' },
      statusCode: 200,
    })

    renderPage()

    expect(await screen.findByText('Administrador da organização')).toBeInTheDocument()
  })

  it('opens the invite drawer from the list header', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Usuários' })

    await user.click(screen.getByRole('button', { name: 'Convidar pessoa' }))

    expect(screen.getByRole('dialog', { name: 'Convidar pessoa' })).toBeInTheDocument()
  })
})
