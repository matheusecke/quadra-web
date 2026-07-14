import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTimeField } from './DateTimeField'
import * as pointer from '../useCoarsePointer'

beforeEach(() => {
  vi.restoreAllMocks()
})

const desktop = () => vi.spyOn(pointer, 'useCoarsePointer').mockReturnValue(false)
const mobile = () => vi.spyOn(pointer, 'useCoarsePointer').mockReturnValue(true)

describe('DateTimeField', () => {
  it('opens the Quadra calendar on a desktop pointer', async () => {
    desktop()
    render(<DateTimeField aria-label="Data e hora" value="2026-08-12T19:00" onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /data e hora/i }))
    expect(screen.getByRole('dialog', { name: /escolher data/i })).toBeInTheDocument()
  })

  it('emits the chosen day keeping the time, in the same format the native input uses', async () => {
    desktop()
    const onChange = vi.fn()
    render(<DateTimeField aria-label="Data e hora" value="2026-08-12T19:00" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /data e hora/i }))
    await userEvent.click(screen.getByRole('button', { name: /20 de agosto de 2026/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(onChange).toHaveBeenCalledWith('2026-08-20T19:00')
  })

  it('closes on Escape and hands focus back to the field', async () => {
    desktop()
    render(<DateTimeField aria-label="Data e hora" value="2026-08-12T19:00" onChange={vi.fn()} />)
    const field = screen.getByRole('button', { name: /data e hora/i })
    await userEvent.click(field)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field).toHaveFocus()
  })

  it('moves one week down and confirms with the keyboard', async () => {
    desktop()
    const onChange = vi.fn()
    render(<DateTimeField aria-label="Data e hora" value="2026-08-12T19:00" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /data e hora/i }))
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('2026-08-19T19:00')
  })

  it('moves one week up and confirms with the keyboard', async () => {
    desktop()
    const onChange = vi.fn()
    render(<DateTimeField aria-label="Data e hora" value="2026-08-12T19:00" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /data e hora/i }))
    await userEvent.keyboard('{ArrowUp}{Enter}')
    expect(onChange).toHaveBeenCalledWith('2026-08-05T19:00')
  })

  it('falls back to the native picker on a touch pointer — the OS wheel beats ours on a phone', () => {
    mobile()
    render(<DateTimeField aria-label="Data e hora" value="2026-08-12T19:00" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Data e hora')).toHaveAttribute('type', 'datetime-local')
  })
})
