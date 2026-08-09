import { act, render, screen } from '@testing-library/react'
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => { resolve = next })
  return { promise, resolve }
}

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

  it('ignores a lookup response after its address is edited', async () => {
    const first = deferred<typeof marina>()
    lookupMock.mockReturnValueOnce(first.promise)
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    const email = screen.getByLabelText('E-mail da pessoa')
    await user.type(email, 'marina@example.com{Enter}')
    await user.clear(email)
    await user.type(email, 'nova@example.com')
    await act(async () => first.resolve(marina))

    expect(screen.queryByRole('button', { name: /Marina Souza/ })).not.toBeInTheDocument()
  })

  it('keeps the newest lookup result when responses arrive in reverse order', async () => {
    const first = deferred<typeof marina>()
    const newest = { id: 7, name: 'Nova Pessoa', email: 'nova@example.com' }
    const second = deferred<typeof newest>()
    lookupMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const user = userEvent.setup()
    render(<UserLookupField value={null} onChange={vi.fn()} />)

    const email = screen.getByLabelText('E-mail da pessoa')
    await user.type(email, 'marina@example.com{Enter}')
    await user.clear(email)
    await user.type(email, 'nova@example.com{Enter}')
    await act(async () => second.resolve(newest))
    expect(await screen.findByRole('button', { name: /Nova Pessoa/ })).toBeInTheDocument()
    await act(async () => first.resolve(marina))

    expect(screen.queryByRole('button', { name: /Marina Souza/ })).not.toBeInTheDocument()
  })
})
