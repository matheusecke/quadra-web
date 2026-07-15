import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Collapse } from './Collapse'

const setReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('Collapse', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders children when open', () => {
    render(<Collapse open><p>panel body</p></Collapse>)
    expect(screen.getByText('panel body')).toBeInTheDocument()
  })

  it('keeps closing children mounted until the animation ends', () => {
    const { rerender } = render(<Collapse open><p>panel body</p></Collapse>)
    rerender(<Collapse open={false}><p>panel body</p></Collapse>)
    expect(screen.getByText('panel body')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(220))
    expect(screen.queryByText('panel body')).not.toBeInTheDocument()
  })

  it('makes the retained closing content non-interactive', () => {
    const { rerender } = render(<Collapse open><button>focus me</button></Collapse>)
    rerender(<Collapse open={false}><button>focus me</button></Collapse>)
    const inner = screen.getByText('focus me').closest('div')
    expect(inner).toHaveAttribute('aria-hidden', 'true')
    expect(inner).toHaveAttribute('inert')
  })

  it('unmounts immediately on close under reduced motion', () => {
    setReducedMotion(true)
    const { rerender } = render(<Collapse open><p>panel body</p></Collapse>)
    rerender(<Collapse open={false}><p>panel body</p></Collapse>)
    expect(screen.queryByText('panel body')).not.toBeInTheDocument()
  })

  it('exposes the region role it is given', () => {
    render(
      <Collapse open id="roster-panel-x" role="region" aria-label="Elenco Time 1">
        <p>body</p>
      </Collapse>,
    )
    expect(screen.getByRole('region', { name: 'Elenco Time 1' })).toBeInTheDocument()
  })

  it('keeps its id present while collapsed for aria-controls', () => {
    render(<Collapse open={false} id="roster-panel-x"><p>body</p></Collapse>)
    expect(document.getElementById('roster-panel-x')).not.toBeNull()
  })
})
