import { useCallback, useEffect, useState, type ReactNode } from 'react'
import api, { setAccessToken } from '../services/api'
import { AuthContext, type AuthStatus } from './auth-context'
import type { ApiResponse, LoginPayload, MePayload, OrgAffiliation, RegisterBody, RegisterInput, TokenPayload } from '../types/api'

async function fetchMe(): Promise<MePayload> {
  const { data } = await api.get<ApiResponse<MePayload>>('/auth/me')
  return data.data
}

async function fetchOrganizations(): Promise<OrgAffiliation[]> {
  const { data } = await api.get<ApiResponse<OrgAffiliation[]>>('/auth/org')
  return data.data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<MePayload | null>(null)
  const [organizations, setOrganizations] = useState<OrgAffiliation[]>([])

  useEffect(() => {
    api
      .post<ApiResponse<TokenPayload>>('/auth/refresh')
      .then(async ({ data }) => {
        setAccessToken(data.data.accessToken)
        const me = await fetchMe()
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        setStatus('unauthenticated')
      })
  }, [])

  useEffect(() => {
    const handle = () => {
      setStatus('unauthenticated')
      setUser(null)
      setOrganizations([])
    }
    window.addEventListener('auth:unauthenticated', handle)
    return () => window.removeEventListener('auth:unauthenticated', handle)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<LoginPayload>>('/auth/login', { email, password })
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
    const body: RegisterBody = {
      email: input.email,
      name: input.name,
      password: input.password,
      birth_date: input.birthDate,
      ...(input.height !== undefined ? { height: input.height } : {}),
    }

    const { data } = await api.post<ApiResponse<LoginPayload>>('/auth/register', body)
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
    const me = await fetchMe()
    setUser(me)
  }, [])

  const refreshOrganizations = useCallback(async () => {
    const nextOrganizations = await fetchOrganizations()
    setOrganizations(nextOrganizations)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
      setOrganizations([])
      setStatus('unauthenticated')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, organizations, login, register, chooseOrg, refreshOrganizations, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
