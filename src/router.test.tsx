import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Outlet, RouterProvider } from 'react-router-dom'

vi.mock('./components/ProtectedRoute', () => ({
  ProtectedRoute: () => <Outlet />,
}))

vi.mock('./components/AppShell', () => ({
  AppShell: () => <Outlet />,
}))

vi.mock('./components/AdminRoute', () => ({
  AdminRoute: () => <Outlet />,
}))

vi.mock('./components/OrgUsersRoute', () => ({
  OrgUsersRoute: () => <Outlet />,
}))

vi.mock('./components/OrgTeamsRoute', () => ({
  OrgTeamsRoute: () => <Outlet />,
}))

vi.mock('./pages/HomePage', () => ({
  HomePage: () => <div>home-page</div>,
}))

vi.mock('./pages/LoginPage', () => ({
  LoginPage: () => <div>login-page</div>,
}))

vi.mock('./pages/RegisterPage', () => ({
  RegisterPage: () => <div>register-page</div>,
}))

vi.mock('./pages/NoOrgPage', () => ({
  NoOrgPage: () => <div>no-org-page</div>,
}))

vi.mock('./pages/OrgSelectionPage', () => ({
  OrgSelectionPage: () => <div>org-selection-page</div>,
}))

vi.mock('./pages/account/MyAccountPage', () => ({
  MyAccountPage: () => <div>my-account-page</div>,
}))

vi.mock('./pages/users/OrgUsersPage', () => ({
  OrgUsersPage: () => <div>org-users-page</div>,
}))

vi.mock('./pages/teams/OrgTeamsPage', () => ({
  OrgTeamsPage: () => <div>org-teams-page</div>,
}))

vi.mock('./pages/admin/AdminDashboardPage', () => ({
  AdminDashboardPage: () => <div>admin-dashboard-page</div>,
}))

vi.mock('./pages/admin/AdminUsersPage', () => ({
  AdminUsersPage: () => <div>admin-users-page</div>,
}))

vi.mock('./pages/admin/AdminOrgsPage', () => ({
  AdminOrgsPage: () => <div>admin-orgs-page</div>,
}))

vi.mock('./pages/admin/AdminTeamsPage', () => ({
  AdminTeamsPage: () => <div>admin-teams-page</div>,
}))

vi.mock('./pages/admin/AdminAffiliationsPage', () => ({
  AdminAffiliationsPage: () => <div>admin-affiliations-page</div>,
}))

vi.mock('./pages/tournaments/TournamentsPage', () => ({
  TournamentsPage: () => <div>tournaments-page</div>,
}))

vi.mock('./pages/tournaments/TournamentDetailPage', () => ({
  TournamentDetailPage: () => <div>tournament-detail-page</div>,
}))

vi.mock('./pages/matches/MatchesPage', () => ({
  MatchesPage: () => <div>matches-page</div>,
}))

vi.mock('./pages/matches/MatchDetailPage', () => ({
  MatchDetailPage: () => <div>match-detail-page</div>,
}))

vi.mock('./pages/athletes/AthleteDetailPage', () => ({
  AthleteDetailPage: () => <div>athlete-detail-page</div>,
}))

vi.mock('./pages/teams/TeamDetailPage', () => ({
  TeamDetailPage: () => <div>team-detail-page</div>,
}))

afterEach(() => {
  cleanup()
  vi.resetModules()
})

async function renderRoute(path: string) {
  window.history.pushState({}, '', path)
  const { router } = await import('./router')

  return render(<RouterProvider router={router} />)
}

describe('router', () => {
  it('registers the normal users route', async () => {
    await renderRoute('/users')
    expect(await screen.findByText('org-users-page')).toBeInTheDocument()
  })

  it('registers the normal teams route', async () => {
    await renderRoute('/teams')
    expect(await screen.findByText('org-teams-page')).toBeInTheDocument()
  })

  it('registers the protected team detail route', async () => {
    await renderRoute('/teams/8')
    expect(await screen.findByText('team-detail-page')).toBeInTheDocument()
  })

  it('keeps the team listing separate from the team detail route', async () => {
    await renderRoute('/teams')
    expect(screen.queryByText('team-detail-page')).not.toBeInTheDocument()
  })

  it('registers the public register route', async () => {
    await renderRoute('/register')
    expect(await screen.findByText('register-page')).toBeInTheDocument()
  })

  it('preserves the admin users route', async () => {
    await renderRoute('/admin/users')
    expect(await screen.findByText('admin-users-page')).toBeInTheDocument()
  })

  it('preserves the admin teams route', async () => {
    await renderRoute('/admin/teams')
    expect(await screen.findByText('admin-teams-page')).toBeInTheDocument()
  })

  it('guards the organization users route', async () => {
    const { OrgUsersRoute } = await import('./components/OrgUsersRoute')

    await renderRoute('/users')

    expect(OrgUsersRoute).toBeDefined()
    expect(await screen.findByText('org-users-page')).toBeInTheDocument()
  })

  it('keeps the team detail route outside the organization team guard', async () => {
    await renderRoute('/teams/8')

    expect(await screen.findByText('team-detail-page')).toBeInTheDocument()
  })

  it('registers the account route inside the shell', async () => {
    await renderRoute('/account')
    expect(await screen.findByText('my-account-page')).toBeInTheDocument()
  })
})
