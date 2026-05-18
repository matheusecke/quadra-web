import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NoOrgPage } from './pages/NoOrgPage'
import { OrgSelectionPage } from './pages/OrgSelectionPage'

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
        ],
      },
    ],
  },
])
