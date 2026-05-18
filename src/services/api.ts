import axios from 'axios'
import type { ApiResponse, TokenPayload } from '../types/api'

// Module-level token — lives outside React to avoid circular deps with AuthContext
let accessToken: string | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // sends the httpOnly refresh token cookie on every request
})

// Inject the access token into every outgoing request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Queue of requests that arrived while a token refresh was in flight
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// On 401: attempt one token refresh, then retry the original request.
// If the refresh itself fails, dispatch an event so AuthContext can log the user out.
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const original = error.config as typeof error.config & { _retry?: boolean }

    // Don't retry if: not a 401, already retried, or the failing request was /auth/refresh
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      original?.url === '/auth/refresh'
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Another refresh is already in flight — queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        if (original) original.headers!['Authorization'] = `Bearer ${token}`
        return api(original!)
      })
    }

    original!._retry = true
    isRefreshing = true

    try {
      const { data } = await api.post<ApiResponse<TokenPayload>>('/auth/refresh')
      const newToken = data.data.accessToken
      setAccessToken(newToken)
      processQueue(null, newToken)
      original!.headers!['Authorization'] = `Bearer ${newToken}`
      return api(original!)
    } catch (refreshError) {
      processQueue(refreshError)
      setAccessToken(null)
      // Notify AuthContext that the session expired
      window.dispatchEvent(new Event('auth:unauthenticated'))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
