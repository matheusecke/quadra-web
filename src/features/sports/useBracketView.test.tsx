import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { bracketLayout } from './bracketLayout'
import { useBracketView } from './useBracketView'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const demoView = async () => {
  const { result } = renderHook(() => useBracketView(1), { wrapper })
  await waitFor(() => expect(result.current.isPending).toBe(false))
  return result.current
}

describe('useBracketView', () => {
  it('returns the demo rounds in order', async () => {
    expect((await demoView()).rounds.map((round) => round.label)).toEqual(['Quartas de final', 'Semifinais', 'Final'])
  })

  it('attaches the linked match to each slot view', async () => {
    expect((await demoView()).slots.every((slot) => slot.match !== null)).toBe(true)
  })

  it('names each enrolled team for the side options', async () => {
    expect((await demoView()).teams).toHaveLength(16)
  })
})

// The regression that protects the §3.4 seed reordering: it runs the real
// layout rule over the real seed. Revert the reordering and these two fail.
describe('the demo bracket', () => {
  it('lays out as a tree', async () => {
    const { rounds, slots } = await demoView()
    expect(bracketLayout(rounds, slots).mode).toBe('tree')
  })

  it('derives six edges', async () => {
    const { rounds, slots } = await demoView()
    expect(bracketLayout(rounds, slots).edges).toHaveLength(6)
  })
})
