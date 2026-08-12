import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
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

function mockRole(role: string, teamId: number | null) {
  useAuthMock.mockReturnValue({
    user: {
      id: 9,
      email: 'pessoa@liga.test',
      name: 'Pessoa Liga',
      isSystemAdmin: false,
      organizationId: 42,
      role,
    },
    organizations: [
      {
        organizationId: 42,
        organizationName: 'Liga Central',
        organizationSlug: 'liga-central',
        role,
        teamId,
      },
    ],
    logout: vi.fn(),
  })
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockRole('ORG_ADMIN', null)
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

  it('offers Minha conta as the first item of the footer panel', async () => {
    renderSidebar('/home')
    await userEvent.click(screen.getByRole('button', { name: /Pessoa Liga/ }))
    const panel = screen.getByRole('dialog', { name: 'Contexto da organização' })
    const actions = within(panel).getAllByRole('button')
    expect(actions.map((button) => button.textContent)).toEqual([
      'Minha conta', 'Trocar organização', 'Sair da conta',
    ])
  })

  it('navigates to /account and closes the panel', async () => {
    function LocationProbe() {
      return <span data-testid="location">{useLocation().pathname}</span>
    }
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Sidebar />
        <LocationProbe />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: /Pessoa Liga/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Minha conta' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/account')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Sidebar administrative section', () => {
  it('names the administrative section Administração for an organization admin', () => {
    mockRole('ORG_ADMIN', null)

    renderSidebar('/home')

    expect(screen.getByText('Administração')).toBeInTheDocument()
  })

  it('gives a team admin a link to its own team instead of the team list', () => {
    mockRole('TEAM_ADMIN', 8)

    renderSidebar('/home')

    expect(screen.getByRole('link', { name: 'Minha equipe' })).toHaveAttribute('href', '/teams/8')
  })

  it('never offers the team list to a team admin', () => {
    mockRole('TEAM_ADMIN', 8)

    renderSidebar('/home')

    expect(screen.queryByRole('link', { name: 'Equipes' })).not.toBeInTheDocument()
  })

  it('still lets a team admin manage users', () => {
    mockRole('TEAM_ADMIN', 8)

    renderSidebar('/home')

    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/users')
  })

  it('hides the administrative section from an athlete', () => {
    mockRole('ATHLETE', 8)

    renderSidebar('/home')

    expect(screen.queryByText('Administração')).not.toBeInTheDocument()
  })

  it('hides the administrative section from the coaching staff', () => {
    mockRole('COACHING_STAFF', 8)

    renderSidebar('/home')

    expect(screen.queryByText('Comissão')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument()
  })

  it('keeps the sports section for an athlete', () => {
    mockRole('ATHLETE', 8)

    renderSidebar('/home')

    expect(screen.getByRole('link', { name: 'Campeonatos' })).toHaveAttribute('href', '/tournaments')
  })
})
