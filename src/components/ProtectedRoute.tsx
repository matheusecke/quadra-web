import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <main className="loading-page">
        <section className="loading-card" aria-live="polite" aria-busy="true">
          <div className="spinner" aria-hidden="true" />
          <p className="page-description">Carregando sessão...</p>
        </section>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
