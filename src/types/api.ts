import type { OrgRole } from './admin'

export type OrgAffiliation = {
  organizationId: number
  organizationName: string
  organizationSlug: string
  role: string
  teamId: number | null
}

export type LoginUser = {
  id: number
  email: string
  name: string
}

export type LoginPayload = {
  accessToken: string
  user: LoginUser
  organizations: OrgAffiliation[]
}

export type TokenPayload = {
  accessToken: string
}

export type MePayload = {
  id: number
  email: string
  name: string
  isSystemAdmin: boolean
  organizationId: number | null
  role: string | null
}

// Generic wrapper matching ResponseTransformInterceptor format
export type ApiResponse<T> = {
  data: T
  statusCode: number
}

export type RegisterInput = {
  email: string
  name: string
  password: string
  birthDate: string
  heightCm?: number
}

export type InviteDecision = 'ACCEPT' | 'REJECT'

export type MyInvite = {
  id: number
  organizationId: number
  organizationName: string
  role: OrgRole
  teamId: number | null
  teamName: string | null
  jerseyNumber: number | null
  status: 'PENDING'
  sentAt: string
  expiresAt: string | null
  isExpired: boolean
}
