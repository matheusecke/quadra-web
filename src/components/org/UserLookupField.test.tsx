import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserLookupField } from './UserLookupField'

const lookupMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  lookupUserByEmail: (...args: unknown[]) => lookupMock(...args),
}))

const marina = { id: 42, name: 'Marina Souza', email: 'marina@example.com' }

const notFound = Object.assign(new Error('User not found'), {
  isAxiosError: true,
  response: { status: 404, data: { error: { code: 'RECORD_NOT_FOUND', message: 'User not found' } } },
})

describe('UserLookupField', () => {
  beforeEach(() => {
    lookupMock.mockReset()
    lookupMock.mockResolvedValue(marina)
  })

  it('searches only when the administrator asks for it', async () => {
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com')

    expect(lookupMock).not.toHaveBeenCalled()
  })

  it('sends the trimmed address when the search button is pressed', async () => {
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), '  marina@example.com  ')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(lookupMock).toHaveBeenCalledWith('marina@example.com')
  })

  it('searches when Enter is pressed in the address field', async () => {
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com{Enter}')

    expect(lookupMock).toHaveBeenCalledWith('marina@example.com')
  })

  it('shows the name and address of the match without selecting it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<UserLookupField value={null} onChange={onChange} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com{Enter}')

    expect(await screen.findByText('Marina Souza')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reports the selected user only after an explicit click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<UserLookupField value={null} onChange={onChange} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com{Enter}')
    await user.click(await screen.findByRole('button', { name: /Marina Souza/ }))

    expect(onChange).toHaveBeenCalledWith(marina)
  })

  it('clears the selection when the address is edited afterwards', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<UserLookupField value={marina} onChange={onChange} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'a')

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('uses one empty message for an address with no active user', async () => {
    lookupMock.mockRejectedValue(notFound)
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'ninguem@example.com{Enter}')

    expect(await screen.findByText('Usuário ativo não encontrado')).toBeInTheDocument()
  })

  it('separates a transport failure from an empty result', async () => {
    lookupMock.mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com{Enter}')

    expect(
      await screen.findByText('Não foi possível buscar o usuário. Tente novamente.'),
    ).toBeInTheDocument()
  })

  it('never searches an empty address', async () => {
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(lookupMock).not.toHaveBeenCalled()
  })
})
