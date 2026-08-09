import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Drawer } from './Drawer'

function Harness() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Abrir painel
      </button>
      <Drawer open={isOpen} onClose={() => setIsOpen(false)} title="Painel de teste">
        <button type="button">Ação interna</button>
      </Drawer>
    </>
  )
}

describe('Drawer', () => {
  it('moves focus into the panel when it opens', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Abrir painel' }))

    expect(screen.getByRole('dialog', { name: 'Painel de teste' })).toHaveFocus()
  })

  it('returns focus to the trigger when the close button is used', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Abrir painel' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Fechar painel' }))

    expect(trigger).toHaveFocus()
  })

  it('returns focus to the trigger when Escape closes it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Abrir painel' })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })
})
