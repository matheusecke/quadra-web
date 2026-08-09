import { describe, expect, it } from 'vitest'
import {
  ORG_ROLE_LABELS,
  affiliationStatusVariant,
  membershipLabel,
  teamAffiliationStatusLabel,
  userAffiliationStatusLabel,
} from './labels'

describe('ORG_ROLE_LABELS', () => {
  it.each([
    ['ORG_ADMIN', 'Administrador da organização'],
    ['TEAM_ADMIN', 'Administrador da equipe'],
    ['ATHLETE', 'Atleta'],
    ['COACHING_STAFF', 'Comissão técnica'],
  ] as const)('translates %s', (role, expected) => {
    expect(ORG_ROLE_LABELS[role]).toBe(expected)
  })
})

describe('userAffiliationStatusLabel', () => {
  it.each([
    ['PENDING', 'Pendente'],
    ['ACTIVE', 'Ativo'],
    ['INACTIVE', 'Inativo'],
    ['REJECTED', 'Rejeitado'],
  ] as const)('translates %s', (status, expected) => {
    expect(userAffiliationStatusLabel(status)).toBe(expected)
  })

  it('reports an expired pending invite as Expirado', () => {
    expect(userAffiliationStatusLabel('PENDING', true)).toBe('Expirado')
  })

  it('keeps an active affiliation active even when an old invite date is expired', () => {
    expect(userAffiliationStatusLabel('ACTIVE', true)).toBe('Ativo')
  })
})

describe('teamAffiliationStatusLabel', () => {
  it.each([
    ['PENDING', 'Pendente'],
    ['ACTIVE', 'Ativa'],
    ['INACTIVE', 'Inativa'],
    ['REJECTED', 'Rejeitada'],
  ] as const)('translates %s', (status, expected) => {
    expect(teamAffiliationStatusLabel(status)).toBe(expected)
  })
})

describe('affiliationStatusVariant', () => {
  it.each([
    ['PENDING', 'warning'],
    ['ACTIVE', 'success'],
    ['INACTIVE', 'default'],
    ['REJECTED', 'danger'],
  ] as const)('maps %s to the %s badge', (status, expected) => {
    expect(affiliationStatusVariant(status)).toBe(expected)
  })

  it('marks an expired pending invite as a danger badge', () => {
    expect(affiliationStatusVariant('PENDING', true)).toBe('danger')
  })
})

describe('membershipLabel', () => {
  it('joins jersey and position', () => {
    expect(membershipLabel(12, 'PG')).toBe('#12 · PG')
  })

  it('shows the jersey alone when there is no position', () => {
    expect(membershipLabel(12, null)).toBe('#12')
  })

  it('shows the position alone when there is no jersey', () => {
    expect(membershipLabel(null, 'C')).toBe('C')
  })

  it('falls back to an em dash when neither is set', () => {
    expect(membershipLabel(null, null)).toBe('—')
  })
})
