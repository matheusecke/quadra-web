import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { OrgSelectionPage } from './pages/OrgSelectionPage'
import { NoOrgPage } from './pages/NoOrgPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/select-org" replace /> },

  { path: '/login', element: <LoginPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: '/select-org', element: <OrgSelectionPage /> },
      { path: '/no-org', element: <NoOrgPage /> },
    ],
  },
])
