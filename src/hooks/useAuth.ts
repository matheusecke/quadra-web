import { useContext } from 'react'
import { AuthContext } from '../contexts/auth-context'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be called inside AuthProvider')
  return ctx
}
