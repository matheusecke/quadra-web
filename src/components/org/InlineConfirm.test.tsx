import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InlineConfirm } from './InlineConfirm'

describe('InlineConfirm', () => {
  it('shows the message it was given', () => {
    render(
      <InlineConfirm
        message="Todos os convites pendentes desta equipe serão cancelados."
        confirmLabel="Cancelar inclusão"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Todos os convites pendentes desta equipe serão cancelados.'),
    ).toBeInTheDocument()
  })

  it('confirms through the labelled action', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <InlineConfirm
        message="Mensagem"
        confirmLabel="Desativar"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Desativar' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('dismisses through Cancelar', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <InlineConfirm
        message="Mensagem"
        confirmLabel="Desativar"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('blocks both actions while the write is in flight', () => {
    render(
      <InlineConfirm
        message="Mensagem"
        confirmLabel="Desativar"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('announces the failure without dismissing itself', () => {
    render(
      <InlineConfirm
        message="Mensagem"
        confirmLabel="Desativar"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        errorMessage="Não foi possível desativar o vínculo."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível desativar o vínculo.')
  })
})
