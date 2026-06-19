import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../contexts/auth-context'
import { useAuth } from '../hooks/useAuth'
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

const chooseOrgMock = vi.fn<() => Promise<void>>()
const logoutMock = vi.fn<() => Promise<void>>()

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
    logout: logoutMock,
    ...overrides,
  }

  vi.mocked(useAuth).mockReturnValue(value)
}

describe('OrgSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chooseOrgMock.mockResolvedValue()
    logoutMock.mockResolvedValue()
    mockAuth()
  })

  it('renders organizations as the default tab without prototype controls', () => {
    render(<OrgSelectionPage />)

    expect(screen.getByRole('heading', { name: 'Selecione a organização' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Organizações' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Convites \(\d+\)/ })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('button', { name: 'Entrar em Liga Metropolitana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar como administrador do sistema' })).toBeInTheDocument()

    expect(screen.queryByText(/Wireframe/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Protótipo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Opção B/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/B · Painel/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/C · Abas/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Convites pendentes/i })).not.toBeInTheDocument()
  })

  it('keeps organization search and selection working', async () => {
    const user = userEvent.setup()
    render(<OrgSelectionPage />)

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
    render(<OrgSelectionPage />)

    await user.click(screen.getByRole('button', { name: 'Entrar como administrador do sistema' }))
    expect(navigateMock).toHaveBeenCalledWith('/admin')

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(logoutMock).toHaveBeenCalled()
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login')
    })
  })

  it('lists pending invites with details and updates local state after responses', async () => {
    const user = userEvent.setup()
    render(<OrgSelectionPage />)

    await user.click(screen.getByRole('tab', { name: 'Convites (10)' }))

    expect(screen.getByRole('tab', { name: 'Convites (10)' })).toHaveAttribute('aria-selected', 'true')
    const inviteRegion = screen.getByRole('region', { name: 'Convites pendentes' })
    expect(within(inviteRegion).getByText('Liga Metropolitana')).toBeInTheDocument()
    expect(within(inviteRegion).getAllByText('Atleta').length).toBeGreaterThan(0)
    expect(within(inviteRegion).getByText(/Campinas Hawks/)).toBeInTheDocument()
    expect(within(inviteRegion).getByText(/Camisa 12/)).toBeInTheDocument()
    expect(within(inviteRegion).getAllByText('Pendente')).toHaveLength(10)
    expect(within(inviteRegion).getByText('Enviado há 2 dias')).toBeInTheDocument()
    expect(within(inviteRegion).getByText('Expira em 5 dias')).toBeInTheDocument()

    await user.click(within(inviteRegion).getAllByRole('button', { name: 'Aceitar' })[0])

    expect(screen.getByRole('tab', { name: 'Convites (9)' })).toBeInTheDocument()
    expect(within(inviteRegion).queryByText('Liga Metropolitana')).not.toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalledWith('/home')

    await user.click(within(inviteRegion).getAllByRole('button', { name: 'Recusar' })[0])

    expect(screen.getByRole('tab', { name: 'Convites (8)' })).toBeInTheDocument()
  })

  it('shows an operational empty state when all pending invites are resolved', async () => {
    const user = userEvent.setup()
    render(<OrgSelectionPage />)

    await user.click(screen.getByRole('tab', { name: 'Convites (10)' }))

    while (screen.queryAllByRole('button', { name: 'Aceitar' }).length > 0) {
      await user.click(screen.getAllByRole('button', { name: 'Aceitar' })[0])
    }

    expect(screen.getByRole('tab', { name: 'Convites (0)' })).toBeInTheDocument()
    expect(screen.getByText('Nenhum convite pendente')).toBeInTheDocument()
    expect(screen.getByText(/Novos convites aparecerão nesta aba/)).toBeInTheDocument()
  })
})
