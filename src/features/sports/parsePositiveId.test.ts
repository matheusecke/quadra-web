import { describe, expect, it } from 'vitest'
import { parsePositiveId } from './parsePositiveId'

describe('parsePositiveId', () => {
  it('aceita inteiro positivo em texto', () => {
    expect(parsePositiveId('42')).toBe(42)
  })

  it('rejeita ausente, vazio, zero, negativo, decimal e não-numérico', () => {
    expect(parsePositiveId(undefined)).toBeNull()
    expect(parsePositiveId(null)).toBeNull()
    expect(parsePositiveId('')).toBeNull()
    expect(parsePositiveId('0')).toBeNull()
    expect(parsePositiveId('-1')).toBeNull()
    expect(parsePositiveId('3.14')).toBeNull()
    expect(parsePositiveId('42abc')).toBeNull()
    expect(parsePositiveId(' 42 ')).toBeNull()
  })
})
