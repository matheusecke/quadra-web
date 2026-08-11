import axios from 'axios'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import api, { refreshAccessToken, setAccessToken } from '../services/api'
import { queryClient } from '../lib/query-client'
import { AuthContext, type AuthStatus } from './auth-context'
import type { ApiResponse, LoginPayload, MePayload, OrgAffiliation, RegisterInput, TokenPayload } from '../types/api'

async function fetchMe(): Promise<MePayload> {
  const { data } = await api.get<ApiResponse<MePayload>>('/auth/me')
  return data.data
}

async function fetchOrganizations(): Promise<OrgAffiliation[]> {
  const { data } = await api.get<ApiResponse<OrgAffiliation[]>>('/auth/org')
  return data.data
}

type RestoredSession = {
  user: MePayload
  organizations: OrgAffiliation[]
}

let restoreSessionPromise: Promise<RestoredSession> | null = null

function restoreSessionSnapshot() {
  if (!restoreSessionPromise) {
    restoreSessionPromise = refreshAccessToken()
      .then(() => Promise.all([fetchMe(), fetchOrganizations()]))
      .then(([user, organizations]) => ({ user, organizations }))
      .finally(() => {
        restoreSessionPromise = null
      })
  }

  return restoreSessionPromise
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<MePayload | null>(null)
  const [organizations, setOrganizations] = useState<OrgAffiliation[]>([])

  useEffect(() => {
    restoreSessionSnapshot()
      .then((session) => {
        setUser(session.user)
        setOrganizations(session.organizations)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        setAccessToken(null)
        setUser(null)
        setOrganizations([])
        setStatus(
          axios.isAxiosError(error) && error.response?.status === 401
            ? 'unauthenticated'
            : 'error',
        )
      })
  }, [])

  useEffect(() => {
    const handle = () => {
      queryClient.clear()
      setStatus('unauthenticated')
      setUser(null)
      setOrganizations([])
    }
    window.addEventListener('auth:unauthenticated', handle)
    return () => window.removeEventListener('auth:unauthenticated', handle)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<LoginPayload>>('/auth/login', { email, password })
    queryClient.clear()
    setAccessToken(data.data.accessToken)
    setOrganizations(data.data.organizations)
    try {
      const me = await fetchMe()
      setUser(me)
      setStatus('authenticated')
    } catch (err) {
      setAccessToken(null)
      throw err
    }
    return { organizations: data.data.organizations }
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const { data } = await api.post<ApiResponse<LoginPayload>>('/auth/register', input)
    queryClient.clear()
    setAccessToken(data.data.accessToken)
    setOrganizations(data.data.organizations)

    try {
      const me = await fetchMe()
      setUser(me)
      setStatus('authenticated')
    } catch (err) {
      setAccessToken(null)
      throw err
    }

    return { organizations: data.data.organizations }
  }, [])

  const chooseOrg = useCallback(async (organizationId: number) => {
    const { data } = await api.post<ApiResponse<TokenPayload>>('/auth/org', { organizationId })
    setAccessToken(data.data.accessToken)
    queryClient.clear()
    const me = await fetchMe()
    setUser(me)
  }, [])

  const refreshOrganizations = useCallback(async () => {
    const nextOrganizations = await fetchOrganizations()
    setOrganizations(nextOrganizations)
  }, [])

  const refreshUser = useCallback(async () => {
    const nextUser = await fetchMe()
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      queryClient.clear()
      setAccessToken(null)
      setUser(null)
      setOrganizations([])
      setStatus('unauthenticated')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, organizations, login, register, chooseOrg, refreshOrganizations, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
