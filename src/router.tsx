import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AdminRoute } from './components/AdminRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NoOrgPage } from './pages/NoOrgPage'
import { OrgSelectionPage } from './pages/OrgSelectionPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminOrgsPage } from './pages/admin/AdminOrgsPage'
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage'
import { AdminAffiliationsPage } from './pages/admin/AdminAffiliationsPage'
import { ChampionshipsPage } from './pages/championships/ChampionshipsPage'
import { ChampionshipDetailPage } from './pages/championships/ChampionshipDetailPage'
import { MatchDetailPage } from './pages/matches/MatchDetailPage'
import { MatchesPage } from './pages/matches/MatchesPage'
import { AthleteDetailPage } from './pages/athletes/AthleteDetailPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/home" replace /> },

  { path: '/login', element: <LoginPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: '/select-org', element: <OrgSelectionPage /> },
      { path: '/no-org', element: <NoOrgPage /> },

      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/championships', element: <ChampionshipsPage /> },
          { path: '/championships/:championshipId', element: <ChampionshipDetailPage /> },
          { path: '/matches', element: <MatchesPage /> },
          { path: '/matches/:matchId', element: <MatchDetailPage /> },
          { path: '/athletes/:athleteId', element: <AthleteDetailPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/organizations', element: <AdminOrgsPage /> },
              { path: '/admin/organizations/:orgId/affiliations', element: <AdminAffiliationsPage /> },
              { path: '/admin/teams', element: <AdminTeamsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
