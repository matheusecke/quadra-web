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
