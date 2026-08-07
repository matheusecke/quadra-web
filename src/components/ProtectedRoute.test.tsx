import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import type { AuthStatus } from '../contexts/auth-context'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)

function renderRoute(initialEntry = '/teams') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/teams" element={<div>teams-page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function setStatus(status: AuthStatus) {
  useAuthMock.mockReturnValue({ status } as ReturnType<typeof useAuth>)
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('blocks routing while status is loading', () => {
    setStatus('loading')
    renderRoute()

    expect(screen.getByLabelText('Carregando sessão')).toBeInTheDocument()
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
    expect(screen.queryByText('teams-page')).not.toBeInTheDocument()
  })

  it('blocks routing while restoration has a retryable error', () => {
    setStatus('error')
    renderRoute()

    expect(
      screen.getByText('Não foi possível restaurar a sessão'),
    ).toBeInTheDocument()
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
    expect(screen.queryByText('teams-page')).not.toBeInTheDocument()
  })

  it('redirects a definitive failure to login', () => {
    setStatus('unauthenticated')
    renderRoute()

    expect(screen.getByText('login-page')).toBeInTheDocument()
    expect(screen.queryByText('teams-page')).not.toBeInTheDocument()
  })

  it('renders the original route after restoration succeeds', () => {
    setStatus('authenticated')
    renderRoute()

    expect(screen.getByText('teams-page')).toBeInTheDocument()
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
  })
})
