import { createContext } from 'react'
import type { MePayload, OrgAffiliation, RegisterInput } from '../types/api'

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

export type AuthContextValue = {
  status: AuthStatus
  user: MePayload | null
  organizations: OrgAffiliation[]
  login: (email: string, password: string) => Promise<{ organizations: OrgAffiliation[] }>
  register: (input: RegisterInput) => Promise<{ organizations: OrgAffiliation[] }>
  chooseOrg: (organizationId: number) => Promise<void>
  refreshOrganizations: () => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
