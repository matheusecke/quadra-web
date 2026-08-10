import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from '../hooks/useAuth'
import api, { refreshAccessToken, setAccessToken } from '../services/api'
import { queryClient } from '../lib/query-client'

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
  refreshAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
}))

const unauthorized = Object.assign(new Error('no refresh cookie'), {
  isAxiosError: true,
  response: { status: 401 },
})

function SessionHarness() {
  const { status, user, organizations } = useAuth()

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="organization-id">{user?.organizationId}</span>
      <span data-testid="organizations">
        {organizations.map((org) => org.organizationName).join(', ')}
      </span>
    </div>
  )
}

function RegisterHarness() {
  const { register } = useAuth()

  return (
    <button
      type="button"
      onClick={() =>
        register({
          email: 'user@example.com',
          name: 'User Name',
          password: 'secret123!',
          birthDate: '1998-04-23',
          heightCm: 182,
        })
      }
    >
      register
    </button>
  )
}

function RefreshOrganizationsHarness() {
  const { organizations, refreshOrganizations } = useAuth()

  return (
    <div>
      <button type="button" onClick={() => refreshOrganizations()}>
        refresh organizations
      </button>
      <span>{organizations.map((org) => org.organizationName).join(', ')}</span>
    </div>
  )
}

function ChooseOrgHarness() {
  const { chooseOrg, user } = useAuth()
  return (
    <div>
      <button type="button" onClick={() => chooseOrg(202)}>choose organization</button>
      <span data-testid="chosen-organization">{user?.organizationId}</span>
    </div>
  )
}

describe('AuthContext session restoration', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    vi.mocked(api.post).mockRejectedValue(unauthorized)
    vi.mocked(api.get).mockReset()
    vi.mocked(refreshAccessToken).mockReset()
    vi.mocked(refreshAccessToken).mockRejectedValue(unauthorized)
    vi.mocked(setAccessToken).mockReset()
  })

  it('restores one complete session under StrictMode', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue('renewed-token')
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: {
            data: {
              id: 1,
              email: 'user@example.com',
              name: 'User Name',
              isSystemAdmin: false,
              organizationId: 101,
              role: 'ADMIN',
            },
            statusCode: 200,
          },
        })
      }

      if (url === '/auth/org') {
        return Promise.resolve({
          data: {
            data: [
              {
                organizationId: 101,
                organizationName: 'Liga Metropolitana',
                organizationSlug: 'liga-metropolitana',
                role: 'ADMIN',
                teamId: null,
              },
              {
                organizationId: 202,
                organizationName: 'Circuito Interior',
                organizationSlug: 'circuito-interior',
                role: 'ATHLETE',
                teamId: 12,
              },
            ],
            statusCode: 200,
          },
        })
      }

      return Promise.reject(new Error(`unexpected GET ${url}`))
    })

    render(
      <StrictMode>
        <AuthProvider>
          <SessionHarness />
        </AuthProvider>
      </StrictMode>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(api.get).toHaveBeenCalledWith('/auth/org')
    expect(screen.getByTestId('organization-id')).toHaveTextContent('101')
    expect(screen.getByTestId('organizations')).toHaveTextContent(
      'Liga Metropolitana, Circuito Interior',
    )
  })

  it('publishes unauthenticated only after a definitive 401', async () => {
    render(
      <StrictMode>
        <AuthProvider>
          <SessionHarness />
        </AuthProvider>
      </StrictMode>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('organization-id')).toBeEmptyDOMElement()
    expect(screen.getByTestId('organizations')).toBeEmptyDOMElement()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('keeps a temporary restoration failure out of unauthenticated state', async () => {
    vi.mocked(refreshAccessToken).mockRejectedValue(
      new Error('network unavailable'),
    )

    render(
      <StrictMode>
        <AuthProvider>
          <SessionHarness />
        </AuthProvider>
      </StrictMode>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
    })
    expect(screen.getByTestId('status')).not.toHaveTextContent(
      'unauthenticated',
    )
  })
})

describe('AuthContext register', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    vi.mocked(api.get).mockReset()
    vi.mocked(refreshAccessToken).mockReset()
    vi.mocked(refreshAccessToken).mockRejectedValue(unauthorized)
    vi.mocked(setAccessToken).mockReset()
  })

  it('posts register payload and authenticates with returned token', async () => {
    vi.mocked(api.post).mockImplementation((url: string, body?: unknown) => {
      if (url === '/auth/refresh') {
        return Promise.reject(new Error('no refresh cookie'))
      }

      if (url === '/auth/register') {
        expect(body).toEqual({
          email: 'user@example.com',
          name: 'User Name',
          password: 'secret123!',
          birthDate: '1998-04-23',
          heightCm: 182,
        })

        return Promise.resolve({
          data: {
            data: {
              accessToken: 'access-token',
              user: { id: 1, email: 'user@example.com', name: 'User Name' },
              organizations: [],
            },
            statusCode: 201,
          },
        })
      }

      return Promise.reject(new Error(`unexpected POST ${url}`))
    })

    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          id: 1,
          email: 'user@example.com',
          name: 'User Name',
          isSystemAdmin: false,
          organizationId: null,
          role: null,
        },
        statusCode: 200,
      },
    })

    render(
      <AuthProvider>
        <RegisterHarness />
      </AuthProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'register' }))

    await waitFor(() => {
      expect(setAccessToken).toHaveBeenCalledWith('access-token')
    })
    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.get).not.toHaveBeenCalledWith('/auth/org')
  })
})

describe('AuthContext refreshOrganizations', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    vi.mocked(api.get).mockReset()
    vi.mocked(refreshAccessToken).mockReset()
    vi.mocked(refreshAccessToken).mockRejectedValue(unauthorized)
    vi.mocked(setAccessToken).mockReset()
  })

  it('refreshes organizations from /auth/org', async () => {
    vi.mocked(api.post).mockImplementation((url: string) => {
      if (url === '/auth/refresh') return Promise.reject(new Error('no refresh cookie'))
      return Promise.reject(new Error(`unexpected POST ${url}`))
    })

    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          {
            organizationId: 303,
            organizationName: 'Liga Atualizada',
            organizationSlug: 'liga-atualizada',
            role: 'ATHLETE',
            teamId: null,
          },
        ],
        statusCode: 200,
      },
    })

    render(
      <AuthProvider>
        <RefreshOrganizationsHarness />
      </AuthProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'refresh organizations' }))

    await waitFor(() => {
      expect(screen.getByText('Liga Atualizada')).toBeInTheDocument()
    })
    expect(api.get).toHaveBeenCalledWith('/auth/org')
  })
})

describe('AuthContext chooseOrg', () => {
  it('clears cached tenant data when the active organization changes', async () => {
    vi.mocked(refreshAccessToken).mockRejectedValue(unauthorized)
    queryClient.setQueryData(['teams', 'list'], [{ id: 1, name: 'Tenant anterior' }])
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { accessToken: 'organization-token' }, statusCode: 200 },
    })
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          id: 1,
          email: 'user@example.com',
          name: 'User Name',
          isSystemAdmin: false,
          organizationId: 202,
          role: 'ORG_ADMIN',
        },
        statusCode: 200,
      },
    })

    render(<AuthProvider><ChooseOrgHarness /></AuthProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'choose organization' }))
    await screen.findByText('202')

    expect(queryClient.getQueryData(['teams', 'list'])).toBeUndefined()
  })
})

function RefreshUserHarness() {
  const { user, refreshUser } = useAuth()

  return (
    <>
      <span data-testid="user-name">{user?.name ?? '—'}</span>
      <button type="button" onClick={() => void refreshUser()}>
        refresh user
      </button>
    </>
  )
}

describe('AuthContext refreshUser', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    vi.mocked(api.get).mockReset()
    vi.mocked(refreshAccessToken).mockReset()
    vi.mocked(setAccessToken).mockReset()
  })

  it('replaces the user with a fresh /auth/me read', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue('access-token')
    const me = (name: string) => ({
      data: {
        data: {
          id: 1,
          email: 'user@example.com',
          name,
          isSystemAdmin: false,
          organizationId: null,
          role: null,
        },
        statusCode: 200,
      },
    })

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve(
          vi.mocked(api.get).mock.calls.filter(([u]) => u === '/auth/me').length > 1
            ? me('Nome Novo')
            : me('User Name'),
        )
      }
      if (url === '/auth/org') {
        return Promise.resolve({ data: { data: [], statusCode: 200 } })
      }
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })

    render(
      <AuthProvider>
        <RefreshUserHarness />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent('User Name'))
    await userEvent.click(screen.getByRole('button', { name: 'refresh user' }))
    await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent('Nome Novo'))
    expect(api.get).not.toHaveBeenCalledWith('/auth/org', expect.anything())
    expect(setAccessToken).not.toHaveBeenCalledWith(null)
  })
})
