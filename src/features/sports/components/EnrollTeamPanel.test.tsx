import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnrollTeamPanel } from './EnrollTeamPanel'

describe('EnrollTeamPanel', () => {
  it('searches remotely and enrolls the selected team', async () => {
    const onSearch = vi.fn().mockResolvedValue([{ id: 8, label: 'Engenharia PUC' }])
    const onEnroll = vi.fn().mockResolvedValue(undefined)
    render(<EnrollTeamPanel onSearch={onSearch} onEnroll={onEnroll} />)
    await userEvent.type(screen.getByRole('combobox'), 'engenharia')
    await userEvent.click(await screen.findByRole('option', { name: 'Engenharia PUC' }))
    await userEvent.click(screen.getByRole('button', { name: 'Inscrever' }))
    expect(onSearch).toHaveBeenCalledWith('engenharia')
    expect(onEnroll).toHaveBeenCalledWith(8)
  })

  it('clears the selected team after a successful enrollment', async () => {
    const onSearch = vi.fn().mockResolvedValue([{ id: 8, label: 'Engenharia PUC' }])
    const onEnroll = vi.fn().mockResolvedValue(undefined)
    render(<EnrollTeamPanel onSearch={onSearch} onEnroll={onEnroll} />)
    await userEvent.type(screen.getByRole('combobox'), 'engenharia')
    await userEvent.click(await screen.findByRole('option', { name: 'Engenharia PUC' }))
    await userEvent.click(screen.getByRole('button', { name: 'Inscrever' }))
    expect(await screen.findByRole('button', { name: 'Inscrever' })).toBeDisabled()
  })

  it('keeps the selected team when enrollment fails', async () => {
    const onSearch = vi.fn().mockResolvedValue([{ id: 8, label: 'Engenharia PUC' }])
    const onEnroll = vi.fn().mockRejectedValue(new Error('duplicate'))
    render(<EnrollTeamPanel onSearch={onSearch} onEnroll={onEnroll} />)
    await userEvent.type(screen.getByRole('combobox'), 'engenharia')
    await userEvent.click(await screen.findByRole('option', { name: 'Engenharia PUC' }))
    await userEvent.click(screen.getByRole('button', { name: 'Inscrever' }))
    expect(await screen.findByRole('button', { name: 'Inscrever' })).toBeEnabled()
    expect(screen.getByRole('combobox')).toHaveValue('Engenharia PUC')
  })
})
