export type PaginationMeta = {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
  links: { first: string; previous: string | null; next: string | null; last: string }
  statusCode: number
}

export type EntityStatus = 'ACTIVE' | 'INACTIVE'
export type AffiliationStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'
export type OrgRole = 'ORG_ADMIN' | 'TEAM_ADMIN' | 'ATHLETE' | 'COACHING_STAFF'

export type AdminUser = {
  id: number
  email: string
  name: string
  status: EntityStatus
  isSystemAdmin: boolean
  createdAt: string
  updatedAt: string
}

export type AdminOrg = {
  id: number
  name: string
  slug: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export type AdminTeam = {
  id: number
  name: string
  slug: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export type AdminUserAffiliation = {
  id: number
  userId: number
  organizationId: number
  role: OrgRole
  teamId: number | null
  jerseyNumber: number | null
  status: AffiliationStatus
  createdByUserId: number | null
  createdAt: string
  updatedAt: string
}

export type AdminTeamAffiliation = {
  id: number
  organizationId: number
  teamId: number
  status: AffiliationStatus
  createdByUserId: number | null
  createdAt: string
  updatedAt: string
}
