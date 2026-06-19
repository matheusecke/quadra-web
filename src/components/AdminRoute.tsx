import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AdminRoute() {
  const { user } = useAuth()
  if (!user?.isSystemAdmin) return <Navigate to="/home" replace />
  return <Outlet />
}
