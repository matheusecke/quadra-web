import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeightField } from './HeightField'

function Harness({ initial = '' }: { initial?: string }) {
  const [digits, setDigits] = useState(initial)
  return (
    <>
      <label htmlFor="height">Altura</label>
      <HeightField id="height" digits={digits} onDigitsChange={setDigits} />
    </>
  )
}

describe('HeightField', () => {
  it('formats typed digits as meters', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('Altura')

    await userEvent.click(input)
    await userEvent.keyboard('182')

    expect(input).toHaveValue('1,82m')
  })

  it('stops at three digits', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('Altura')

    await userEvent.click(input)
    await userEvent.keyboard('18299')

    expect(input).toHaveValue('1,82m')
  })

  it('removes the last digit on Backspace', async () => {
    render(<Harness initial="182" />)
    const input = screen.getByLabelText('Altura')

    await userEvent.click(input)
    await userEvent.keyboard('{Backspace}')

    expect(input).toHaveValue('0,18m')
  })

  it('ignores letters instead of showing them', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('Altura')

    await userEvent.click(input)
    await userEvent.keyboard('abc')

    expect(input).toHaveValue('')
  })

  it('increments and decrements through the arrow buttons', async () => {
    render(<Harness initial="182" />)

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar altura' }))
    expect(screen.getByLabelText('Altura')).toHaveValue('1,83m')

    await userEvent.click(screen.getByRole('button', { name: 'Diminuir altura' }))
    expect(screen.getByLabelText('Altura')).toHaveValue('1,82m')
  })

  it('clears the value when decrementing from empty or from 1', async () => {
    const onDigitsChange = vi.fn()
    render(
      <HeightField id="h" digits="1" onDigitsChange={onDigitsChange} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Diminuir altura' }))

    expect(onDigitsChange).toHaveBeenCalledWith('')
  })
})
