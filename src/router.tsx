import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AdminRoute } from './components/AdminRoute'
import { OrgAdminRoute } from './components/OrgAdminRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { NoOrgPage } from './pages/NoOrgPage'
import { OrgSelectionPage } from './pages/OrgSelectionPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminOrgsPage } from './pages/admin/AdminOrgsPage'
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage'
import { AdminAffiliationsPage } from './pages/admin/AdminAffiliationsPage'
import { OrgUsersPage } from './pages/users/OrgUsersPage'
import { OrgTeamsPage } from './pages/teams/OrgTeamsPage'
import { TournamentsPage } from './pages/tournaments/TournamentsPage'
import { TournamentDetailPage } from './pages/tournaments/TournamentDetailPage'
import { SeasonsPage } from './pages/tournaments/seasons/SeasonsPage'
import { CategoriesPage } from './pages/tournaments/categories/CategoriesPage'
import { TournamentFormPage } from './pages/tournaments/TournamentFormPage'
import { MatchFormPage } from './pages/matches/MatchFormPage'
import { MatchDetailPage } from './pages/matches/MatchDetailPage'
import { MatchesPage } from './pages/matches/MatchesPage'
import { AthleteDetailPage } from './pages/athletes/AthleteDetailPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/home" replace /> },

  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: '/select-org', element: <OrgSelectionPage /> },
      { path: '/no-org', element: <NoOrgPage /> },

      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/users', element: <OrgUsersPage /> },
          { path: '/teams', element: <OrgTeamsPage /> },
          { path: '/tournaments', element: <TournamentsPage /> },
          {
            element: <OrgAdminRoute />,
            children: [
              { path: '/tournaments/seasons', element: <SeasonsPage /> },
              { path: '/tournaments/categories', element: <CategoriesPage /> },
              { path: '/tournaments/new', element: <TournamentFormPage /> },
              { path: '/tournaments/:tournamentId/edit', element: <TournamentFormPage /> },
              { path: '/tournaments/:tournamentId/matches/new', element: <MatchFormPage /> },
              { path: '/matches/new', element: <MatchFormPage /> },
            ],
          },
          { path: '/tournaments/:tournamentId', element: <TournamentDetailPage /> },
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
