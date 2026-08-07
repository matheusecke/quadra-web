import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StatColumnsConfig } from './StatColumnsConfig'

const open = () => fireEvent.click(screen.getByRole('button', { name: /configurar estatísticas/i }))

describe('StatColumnsConfig', () => {
  it('toggles an empty group off without confirmation', () => {
    const onToggle = vi.fn()
    render(<StatColumnsConfig disabledColumns={[]} groupHasData={() => false} onToggle={onToggle} />)

    open()
    fireEvent.click(screen.getByRole('switch', { name: /tocos/i }))

    expect(onToggle).toHaveBeenCalledWith(['blk'], false)
  })

  it('asks to confirm before disabling a group that has data', () => {
    const onToggle = vi.fn()
    render(<StatColumnsConfig disabledColumns={[]} groupHasData={() => true} onToggle={onToggle} />)

    open()
    fireEvent.click(screen.getByRole('switch', { name: /pontos/i }))

    expect(onToggle).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /descartar/i }))
    expect(onToggle).toHaveBeenCalledWith(['pts'], false)
  })

  it('uses one switch for all six shooting counters', () => {
    const onToggle = vi.fn()
    render(<StatColumnsConfig disabledColumns={[]} groupHasData={() => false} onToggle={onToggle} />)

    open()
    fireEvent.click(screen.getByRole('switch', { name: /arremessos/i }))

    expect(onToggle).toHaveBeenCalledWith(['fgm', 'fga', 'threeFgm', 'threeFga', 'ftm', 'fta'], false)
  })
})
