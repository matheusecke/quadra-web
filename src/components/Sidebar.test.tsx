import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'

const useAuthMock = vi.fn()

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

function renderSidebar(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
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
      logout: vi.fn(),
    })
  })

  it('points normal organization navigation to users and teams routes', () => {
    renderSidebar('/home')

    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/users')
    expect(screen.getByRole('link', { name: 'Equipes' })).toHaveAttribute('href', '/teams')
  })

  it('points admin navigation to admin users and teams routes', () => {
    renderSidebar('/admin')

    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('link', { name: 'Equipes' })).toHaveAttribute('href', '/admin/teams')
  })
})
