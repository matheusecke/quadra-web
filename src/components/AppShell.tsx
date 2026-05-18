import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BootstrapSkeleton } from './BootstrapSkeleton'
import { Sidebar } from './Sidebar'
import s from './AppShell.module.css'

export function AppShell() {
  const { status, user } = useAuth()

  if (status === 'loading') return <BootstrapSkeleton />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (!user?.organizationId) return <Navigate to="/select-org" replace />

  return (
    <div className={s.shell}>
      <Sidebar />
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  )
}
