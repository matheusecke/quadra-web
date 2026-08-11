import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../contexts/auth-context'
import { useAuth } from '../hooks/useAuth'
import { listMyInvites, respondToMyInvite } from '../services/inviteApi'
import { OrgSelectionPage } from './OrgSelectionPage'

const navigateMock = vi.fn()

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../services/inviteApi', () => ({
  listMyInvites: vi.fn(),
  respondToMyInvite: vi.fn(),
}))

const chooseOrgMock = vi.fn<() => Promise<void>>()
const logoutMock = vi.fn<() => Promise<void>>()
const refreshOrganizationsMock = vi.fn<() => Promise<void>>()

const apiInvites = [
  {
    id: 1,
    organizationId: 101,
    organizationName: 'Liga Metropolitana',
    role: 'ATHLETE' as const,
    teamId: 77,
    teamName: 'Campinas Hawks',
    jerseyNumber: 12,
    status: 'PENDING' as const,
    sentAt: '2026-06-17T12:00:00.000Z',
    expiresAt: '2026-06-24T12:00:00.000Z',
    isExpired: false,
  },
  {
    id: 2,
    organizationId: 202,
    organizationName: 'Circuito Interior',
    role: 'COACHING_STAFF' as const,
    teamId: null,
    teamName: null,
    jerseyNumber: null,
    status: 'PENDING' as const,
    sentAt: '2026-06-16T12:00:00.000Z',
    expiresAt: '2026-06-18T12:00:00.000Z',
    isExpired: true,
  },
]

function mockAuth(overrides: Partial<AuthContextValue> = {}) {
  const value: AuthContextValue = {
    status: 'authenticated',
    user: {
      id: 1,
      email: 'ana@example.com',
      name: 'Ana Ribeiro',
      isSystemAdmin: true,
      organizationId: null,
      role: null,
    },
    organizations: [
      {
        organizationId: 101,
        organizationName: 'Liga Metropolitana',
        organizationSlug: 'liga-metropolitana',
        role: 'ORG_ADMIN',
        teamId: null,
      },
      {
        organizationId: 202,
        organizationName: 'Circuito Interior',
        organizationSlug: 'circuito-interior',
        role: 'ATHLETE',
        teamId: 77,
      },
    ],
    login: vi.fn(),
    register: vi.fn(),
    chooseOrg: chooseOrgMock,
    refreshOrganizations: refreshOrganizationsMock,
    refreshUser: vi.fn(),
    logout: logoutMock,
    ...overrides,
  }

  vi.mocked(useAuth).mockReturnValue(value)
}

function renderPage() {
  return render(
    <MemoryRouter>
      <OrgSelectionPage />
    </MemoryRouter>,
  )
}

describe('OrgSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chooseOrgMock.mockResolvedValue()
    logoutMock.mockResolvedValue()
    refreshOrganizationsMock.mockResolvedValue()
    vi.mocked(listMyInvites).mockResolvedValue([...apiInvites])
    vi.mocked(respondToMyInvite).mockImplementation(() => Promise.resolve())
    mockAuth()
  })

  it('renders organizations as the default tab without prototype controls', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Selecione a organização' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Organizações' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Convites (0)' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('button', { name: 'Entrar em Liga Metropolitana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar como administrador do sistema' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })

    expect(screen.queryByText(/Wireframe/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Protótipo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Opção B/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/B · Painel/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/C · Abas/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Convites pendentes/i })).not.toBeInTheDocument()
  })

  it('keeps organization search and selection working', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar organização' }), 'interior')

    expect(screen.queryByRole('button', { name: 'Entrar em Liga Metropolitana' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Entrar em Circuito Interior' }))

    expect(chooseOrgMock).toHaveBeenCalledWith(202)
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/home')
    })
  })

  it('preserves system admin entry and logout navigation', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Entrar como administrador do sistema' }))
    expect(navigateMock).toHaveBeenCalledWith('/admin')

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(logoutMock).toHaveBeenCalled()
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login')
    })
  })

  it('shows invite loading state while invites are pending', async () => {
    vi.mocked(listMyInvites).mockImplementation(() => new Promise(() => undefined))

    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Convites (0)' }))

    expect(screen.getByText('Carregando convites')).toBeInTheDocument()
  })

  it('shows invite error state and retries listing', async () => {
    const user = userEvent.setup()
    vi.mocked(listMyInvites)
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce([...apiInvites])

    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Convites (0)' }))
    expect(await screen.findByText('Não foi possível carregar os convites')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => {
      expect(listMyInvites).toHaveBeenCalledTimes(2)
    })
    expect(await screen.findByText('Liga Metropolitana')).toBeInTheDocument()
  })

  it('shows invite empty state when api returns no invites', async () => {
    const user = userEvent.setup()
    vi.mocked(listMyInvites).mockResolvedValue([])

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (0)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (0)' }))

    expect(screen.getByText('Nenhum convite pendente')).toBeInTheDocument()
  })

  it('accepts an invite, refreshes organizations, and stays on select-org', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))

    await user.click(screen.getAllByRole('button', { name: 'Aceitar' })[0])

    expect(respondToMyInvite).toHaveBeenCalledWith(1, 'ACCEPT')
    await waitFor(() => {
      expect(refreshOrganizationsMock).toHaveBeenCalled()
    })
    expect(screen.queryByText('Liga Metropolitana')).not.toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalledWith('/home')
  })

  it('rejects an invite and removes it after api success', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))

    // Primeiro clique abre confirmação — não chama API
    await user.click(screen.getAllByRole('button', { name: 'Recusar' })[0])
    expect(respondToMyInvite).not.toHaveBeenCalled()

    // Segundo clique (Confirmar) executa a rejeição
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(respondToMyInvite).toHaveBeenCalledWith(1, 'REJECT')
    await waitFor(() => {
      expect(screen.queryByText('Liga Metropolitana')).not.toBeInTheDocument()
    })
    expect(refreshOrganizationsMock).not.toHaveBeenCalled()
  })

  it('shows inline confirmation when clicking Recusar, without calling the API', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))

    await user.click(screen.getAllByRole('button', { name: 'Recusar' })[0])

    expect(respondToMyInvite).not.toHaveBeenCalled()
    expect(screen.getByText('Recusar este convite?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('dismisses confirmation when clicking Cancelar, without calling the API', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))

    await user.click(screen.getAllByRole('button', { name: 'Recusar' })[0])
    expect(screen.getByText('Recusar este convite?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(respondToMyInvite).not.toHaveBeenCalled()
    expect(screen.queryByText('Recusar este convite?')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Recusar' })).toHaveLength(2)
  })

  it('replaces first card confirmation when clicking Recusar on a second card', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))

    const [firstReject, secondReject] = screen.getAllByRole('button', { name: 'Recusar' })
    await user.click(firstReject)
    expect(screen.getByText('Recusar este convite?')).toBeInTheDocument()

    // Clicar no segundo Recusar substitui a confirmação do primeiro
    await user.click(secondReject)
    expect(screen.queryAllByText('Recusar este convite?')).toHaveLength(1)
    expect(respondToMyInvite).not.toHaveBeenCalled()
  })

  it('shows error banner when refreshOrganizations fails after accept', async () => {
    const user = userEvent.setup()
    refreshOrganizationsMock.mockRejectedValueOnce(new Error('network error'))

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))
    await user.click(screen.getAllByRole('button', { name: 'Aceitar' })[0])

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Não foi possível atualizar a lista de organizações.')
    expect(screen.getByRole('button', { name: 'Tentar atualizar' })).toBeInTheDocument()
  })

  it('keeps invite visible when response fails', async () => {
    const user = userEvent.setup()
    vi.mocked(respondToMyInvite).mockRejectedValueOnce(new Error('failed'))

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))
    await user.click(screen.getAllByRole('button', { name: 'Aceitar' })[0])

    expect(
      await screen.findByText('Não foi possível responder ao convite. Tente novamente.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Liga Metropolitana')).toBeInTheDocument()
  })

  it('disables accept and keeps reject available for expired invites', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Convites (2)' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Convites (2)' }))

    const expiredCard = screen.getByText('Circuito Interior').closest('article')
    expect(expiredCard).not.toBeNull()
    expect(within(expiredCard!).getByText('Expirado')).toBeInTheDocument()
    expect(within(expiredCard!).getByRole('button', { name: 'Aceitar' })).toBeDisabled()
    expect(within(expiredCard!).getByRole('button', { name: 'Recusar' })).not.toBeDisabled()
  })

  it('links Minha conta to /account', () => {
    renderPage()

    expect(screen.getByRole('link', { name: 'Minha conta' })).toHaveAttribute('href', '/account')
  })
})
