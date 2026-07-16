import { describe, expect, it } from 'vitest'

import { roundDisplayName, slotDisplayName } from './sportsUtils'

describe('slotDisplayName', () => {
  it('uses the slot own label when it has one', () => {
    expect(slotDisplayName({ label: 'Disputa de 3º lugar', position: 2 }, { label: 'Final' })).toBe('Disputa de 3º lugar')
  })

  it('falls back to the round label plus the position', () => {
    expect(slotDisplayName({ label: null, position: 3 }, { label: 'Quartas de final' })).toBe('Quartas de final 3')
  })

  it('falls back to the position alone when the round has no label', () => {
    expect(slotDisplayName({ label: null, position: 3 }, { label: null })).toBe('Vaga 3')
  })
})

describe('roundDisplayName', () => {
  it('uses the round label when it has one', () => {
    expect(roundDisplayName({ label: 'Semifinais', number: 2 })).toBe('Semifinais')
  })

  it('falls back to the round number when the round has no label', () => {
    expect(roundDisplayName({ label: null, number: 2 })).toBe('Rodada 2')
  })
})
