import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { queryClient } from './lib/query-client'
import { router } from './router'
import './index.css'
import './design-system/theme.css'
import './design-system/scrollbar.css'

const getStoredThemePreference = () => {
  try {
    return localStorage.getItem('quadra.theme')
  } catch {
    return null
  }
}

const themePreferenceQuery = window.matchMedia('(prefers-color-scheme: dark)')

const syncThemeWithSystemPreference = () => {
  if (getStoredThemePreference()) return

  document.documentElement.dataset.theme = themePreferenceQuery.matches ? 'dark' : 'light'
}

syncThemeWithSystemPreference()
themePreferenceQuery.addEventListener('change', syncThemeWithSystemPreference)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
