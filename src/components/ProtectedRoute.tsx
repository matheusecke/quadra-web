import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BootstrapSkeleton } from './BootstrapSkeleton'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <BootstrapSkeleton />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  return <Outlet />
}
