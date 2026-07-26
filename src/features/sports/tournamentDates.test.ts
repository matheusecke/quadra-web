import { describe, expect, it } from 'vitest'
import { toDayInput, toInstant } from './tournamentDates'

describe('tournamentDates', () => {
  it('preserva o dia escolhido na ida e volta', () => {
    expect(toDayInput(toInstant('2026-01-10'))).toBe('2026-01-10')
  })

  it('converte para a meia-noite local, não a UTC', () => {
    const instant = toInstant('2026-01-10')!
    expect(new Date(instant).getHours()).toBe(0)
  })

  it('leva o encerramento da inscrição para o fim do dia', () => {
    const instant = toInstant('2025-12-15', true)!
    expect(new Date(instant).getHours()).toBe(23)
  })

  it('trata campo vazio como ausência de data', () => {
    expect(toInstant('')).toBeNull()
  })

  it('devolve string vazia para o input quando não há data', () => {
    expect(toDayInput(null)).toBe('')
  })
})
