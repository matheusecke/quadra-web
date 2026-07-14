import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberField } from './NumberField'

describe('NumberField', () => {
  it('increments through the up arrow', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField
        aria-label="Número"
        controlLabel="número"
        value={7}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /aumentar número/i }))
    expect(onValueChange).toHaveBeenCalledWith(8)
  })

  it('disables the down arrow at the minimum instead of producing an invalid value', () => {
    render(
      <NumberField
        aria-label="Número"
        controlLabel="número"
        value={0}
        min={0}
        onValueChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /diminuir número/i })).toBeDisabled()
  })

  it('does not clamp mid-typing — a min of 10 must still let you type 25', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField
        aria-label="Altura"
        controlLabel="altura"
        value=""
        min={10}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.type(screen.getByLabelText('Altura'), '2')
    expect(onValueChange).toHaveBeenCalledWith(2)
  })

  it('clamps to the minimum on blur, once typing is done', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField
        aria-label="Altura"
        controlLabel="altura"
        value={2}
        min={10}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.click(screen.getByLabelText('Altura'))
    await userEvent.tab()
    expect(onValueChange).toHaveBeenCalledWith(10)
  })

  it('accepts an empty value, so a field can be cleared', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField
        aria-label="Número"
        controlLabel="número"
        value={7}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.clear(screen.getByLabelText('Número'))
    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('keeps the arrows in the dense variant — the box score has them too', () => {
    render(
      <NumberField
        aria-label="PTS"
        controlLabel="PTS"
        value={12}
        dense
        onValueChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /aumentar pts/i })).toBeInTheDocument()
  })
})
