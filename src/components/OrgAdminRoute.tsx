import { Navigate, Outlet } from 'react-router-dom'
import { useIsOrgAdmin } from '../features/sports/useIsOrgAdmin'

export function OrgAdminRoute() {
  const isOrgAdmin = useIsOrgAdmin()
  if (!isOrgAdmin) return <Navigate to="/home" replace />
  return <Outlet />
}
