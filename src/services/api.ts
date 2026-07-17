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

let refreshPromise: Promise<string> | null = null

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post<ApiResponse<TokenPayload>>('/auth/refresh')
      .then(({ data }) => {
        const token = data.data.accessToken
        setAccessToken(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
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

    original!._retry = true

    try {
      const token = await refreshAccessToken()
      original!.headers!['Authorization'] = `Bearer ${token}`
      return api(original!)
    } catch (refreshError) {
      if (
        axios.isAxiosError(refreshError) &&
        refreshError.response?.status === 401
      ) {
        setAccessToken(null)
        // Notify AuthContext that the session expired
        window.dispatchEvent(new Event('auth:unauthenticated'))
      }
      return Promise.reject(refreshError)
    }
  },
)

export default api
