import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BootstrapSkeleton } from './BootstrapSkeleton'
import { ErrorState } from './ui'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <BootstrapSkeleton />
  if (status === 'error') {
    return (
      <ErrorState
        title="Não foi possível restaurar a sessão"
        description="Verifique sua conexão e tente novamente."
        onRetry={() => window.location.reload()}
      />
    )
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  return <Outlet />
}
