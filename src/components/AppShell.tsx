import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BootstrapSkeleton } from './BootstrapSkeleton'
import { Sidebar } from './Sidebar'
import s from './AppShell.module.css'

export function AppShell() {
  const { status, user } = useAuth()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (status === 'loading') return <BootstrapSkeleton />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (!user?.organizationId && !isAdminRoute) return <Navigate to="/select-org" replace />

  return (
    <div className={s.shell}>
      <Sidebar />
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  )
}
