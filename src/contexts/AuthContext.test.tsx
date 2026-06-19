import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from '../hooks/useAuth'
import api, { setAccessToken } from '../services/api'

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setAccessToken: vi.fn(),
}))

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
          height: 182,
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

describe('AuthContext register', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    vi.mocked(api.get).mockReset()
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
          birth_date: '1998-04-23',
          height: 182,
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
