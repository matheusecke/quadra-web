import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrgUsersPage } from './OrgUsersPage'

const useAuthMock = vi.fn()
const listOrgUsersMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../services/orgApi', () => ({
  listOrgUsers: (...args: unknown[]) => listOrgUsersMock(...args),
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
    expect(screen.getByText('Organização ativa')).toBeInTheDocument()
    expect(screen.getByText('Liga Central')).toBeInTheDocument()
    expect(await screen.findByText('Ana Costa')).toBeInTheDocument()
    expect(screen.getByText('ana@liga.test')).toBeInTheDocument()
    expect(screen.getAllByText('ATHLETE')[1]).toBeInTheDocument()
    expect(screen.getByText('Tigres')).toBeInTheDocument()
    expect(screen.getByText('23')).toBeInTheDocument()
    expect(screen.getAllByText('Ativo')[1]).toBeInTheDocument()
    expect(pageHeader).toContainElement(screen.getByLabelText('Buscar usuários da organização'))
    expect(pageHeader).toContainElement(screen.getByLabelText('Filtrar usuários por status'))
    expect(pageHeader).toContainElement(screen.getByLabelText('Filtrar usuários por papel'))
    expect(listOrgUsersMock).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: undefined,
      status: undefined,
      role: undefined,
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
    await user.selectOptions(screen.getByLabelText('Filtrar usuários por status'), 'ACTIVE')
    await user.selectOptions(screen.getByLabelText('Filtrar usuários por papel'), 'ATHLETE')

    await waitFor(() => {
      expect(listOrgUsersMock).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        q: 'ana',
        status: 'ACTIVE',
        role: 'ATHLETE',
      })
    })
  })
})
