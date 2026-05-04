import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { OrgSelectionPage } from './pages/OrgSelectionPage'
import { HomePage } from './pages/HomePage'

export const router = createBrowserRouter([
  // Root redirects to /home; ProtectedRoute handles the auth check from there
  { path: '/', element: <Navigate to="/home" replace /> },

  { path: '/login', element: <LoginPage /> },

  {
    // All routes inside here require authentication
    element: <ProtectedRoute />,
    children: [
      { path: '/select-org', element: <OrgSelectionPage /> },
      { path: '/home', element: <HomePage /> },
    ],
  },
])
