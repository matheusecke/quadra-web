import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSeasonsQuery, useCreateSeason } from './queries'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('season queries', () => {
  it('creates a season and reflects it in the seasons query', async () => {
    const created = renderHook(() => useCreateSeason(), { wrapper })
    await created.result.current.mutateAsync({ label: '2027', startDate: '2027-01-01', endDate: '2027-12-31' })
    const list = renderHook(() => useSeasonsQuery(), { wrapper })
    await waitFor(() => expect(list.result.current.data?.some((s) => s.label === '2027')).toBe(true))
  })
})
