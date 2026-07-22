import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InlineCreateField } from './InlineCreateField'

describe('InlineCreateField', () => {
  it('creates a new option inline and selects it', async () => {
    const onChange = vi.fn()
    const onCreate = vi.fn().mockResolvedValue({ id: 1 })
    render(<InlineCreateField label="Temporada" options={[]} value={null} onChange={onChange} onCreate={onCreate} createLabel="criar temporada" />)
    await userEvent.click(screen.getByRole('button', { name: /criar temporada/i }))
    await userEvent.type(screen.getByLabelText(/nova temporada/i), '2029')
    await userEvent.click(screen.getByRole('button', { name: /adicionar/i }))
    expect(onCreate).toHaveBeenCalledWith('2029')
    expect(onChange).toHaveBeenCalledWith(1)
  })
})
