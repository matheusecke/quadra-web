import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('passes the placeholder to the native input', () => {
    render(<Input placeholder="nome@empresa.com" aria-label="Email" />)

    expect(screen.getByLabelText('Email')).toHaveAttribute('placeholder', 'nome@empresa.com')
  })
})
