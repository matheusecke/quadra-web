import { createContext } from 'react'
import type { MePayload, OrgAffiliation } from '../types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  status: AuthStatus
  user: MePayload | null
  organizations: OrgAffiliation[]
  login: (email: string, password: string) => Promise<{ organizations: OrgAffiliation[] }>
  chooseOrg: (organizationId: number) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
