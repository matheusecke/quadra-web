import { useAuth } from '../../hooks/useAuth'

/** True when the active organization role is ORG_ADMIN. */
export const useIsOrgAdmin = (): boolean => useAuth().user?.role === 'ORG_ADMIN'
