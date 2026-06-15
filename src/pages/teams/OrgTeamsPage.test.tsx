import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrgTeamsPage } from './OrgTeamsPage'

const useAuthMock = vi.fn()
const listOrgTeamsMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../services/orgApi', () => ({
  listOrgTeams: (...args: unknown[]) => listOrgTeamsMock(...args),
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
      <OrgTeamsPage />
    </QueryClientProvider>,
  )
}

describe('OrgTeamsPage', () => {
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

    listOrgTeamsMock.mockReset()
    listOrgTeamsMock.mockResolvedValue({
      data: [
        {
          id: 3,
          organizationId: 42,
          teamId: 18,
          team: {
            id: 18,
            name: 'Lobos',
          },
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

  it('renders the active organization team list and queries it without orgId in the call shape', async () => {
    renderPage()

    const heading = await screen.findByRole('heading', { name: 'Equipes' })
    const pageHeader = heading.closest('div')?.parentElement?.parentElement

    expect(heading).toBeInTheDocument()
    expect(await screen.findByText('Lobos')).toBeInTheDocument()
    expect(screen.getAllByText('Ativo')[1]).toBeInTheDocument()
    expect(pageHeader).toContainElement(screen.getByLabelText('Buscar equipes da organização'))
    expect(pageHeader).toContainElement(screen.getByLabelText('Filtrar equipes por status'))
    expect(listOrgTeamsMock).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: undefined,
      status: undefined,
    })
  })

  it('renders skeleton rows while the team list query is still loading', () => {
    listOrgTeamsMock.mockReset()
    listOrgTeamsMock.mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('renders an empty state when the organization has no teams to show', async () => {
    listOrgTeamsMock.mockReset()
    listOrgTeamsMock.mockResolvedValue({
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

    expect(await screen.findByText('Nenhuma equipe encontrada nesta organização.')).toBeInTheDocument()
  })

  it('renders a generic error state and retries the team query on demand', async () => {
    const user = userEvent.setup()

    listOrgTeamsMock.mockReset()
    listOrgTeamsMock.mockRejectedValue(new Error('network'))

    renderPage()

    expect(
      await screen.findByText('Não foi possível carregar as equipes desta organização.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(listOrgTeamsMock).toHaveBeenCalledTimes(2)
  })

  it('renders the authorization-specific copy for 403 team responses', async () => {
    listOrgTeamsMock.mockReset()
    listOrgTeamsMock.mockRejectedValue({
      response: {
        status: 403,
      },
    })

    renderPage()

    expect(
      await screen.findByText(
        'Seu papel atual não permite carregar a lista de equipes desta organização.',
      ),
    ).toBeInTheDocument()
  })

  it('applies search and status filters without introducing orgId into the API call', async () => {
    const user = userEvent.setup()

    listOrgTeamsMock.mockReset()
    listOrgTeamsMock.mockResolvedValue({
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
    await screen.findByRole('heading', { name: 'Equipes' })

    await user.type(screen.getByLabelText('Buscar equipes da organização'), 'lob')
    await user.selectOptions(screen.getByLabelText('Filtrar equipes por status'), 'ACTIVE')

    await waitFor(() => {
      expect(listOrgTeamsMock).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        q: 'lob',
        status: 'ACTIVE',
      })
    })
  })
})
