import { useCallback, useEffect, useState, type ReactNode } from 'react'
import api, { setAccessToken } from '../services/api'
import { AuthContext, type AuthStatus } from './auth-context'
import type { ApiResponse, LoginPayload, OrgAffiliation, TokenPayload } from '../types/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [organizations, setOrganizations] = useState<OrgAffiliation[]>([])

  // On mount: attempt a silent token refresh using the httpOnly cookie.
  // If the cookie is valid the user stays authenticated without re-logging in.
  useEffect(() => {
    api
      .post<ApiResponse<TokenPayload>>('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.data.accessToken)
        setStatus('authenticated')
      })
      .catch(() => {
        setStatus('unauthenticated')
      })
  }, [])

  // The 401 interceptor in api.ts dispatches this event when the refresh fails mid-session
  useEffect(() => {
    const handle = () => {
      setStatus('unauthenticated')
      setOrganizations([])
    }
    window.addEventListener('auth:unauthenticated', handle)
    return () => window.removeEventListener('auth:unauthenticated', handle)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<LoginPayload>>('/auth/login', { email, password })
    setAccessToken(data.data.accessToken)
    setOrganizations(data.data.organizations)
    setStatus('authenticated')
    return { organizations: data.data.organizations }
  }, [])

  const chooseOrg = useCallback(async (organizationId: number) => {
    const { data } = await api.post<ApiResponse<TokenPayload>>('/auth/org', { organizationId })
    setAccessToken(data.data.accessToken)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setOrganizations([])
      setStatus('unauthenticated')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ status, organizations, login, chooseOrg, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
