import { describe, expect, it } from 'vitest'
import {
  TEAM_PROFILE_STATUS_LABELS,
  TOURNAMENT_TEAM_STATUS_LABELS,
  formatAverage,
  formatRate,
  formatSignedAverage,
  formatTeamLocation,
  teamProfileStatusVariant,
} from './sportsUtils'

describe('team profile labels', () => {
  it('labels the three contextual team statuses in Portuguese', () => {
    expect(TEAM_PROFILE_STATUS_LABELS).toEqual({
      ACTIVE: 'Ativa',
      HISTORICAL: 'Histórica',
      INACTIVE: 'Inativa',
    })
  })

  it('labels the two participation statuses in Portuguese', () => {
    expect(TOURNAMENT_TEAM_STATUS_LABELS).toEqual({ ACTIVE: 'Ativa', WITHDRAWN: 'Desistente' })
  })

  it('marks a historical-only team as neutral rather than active', () => {
    expect(teamProfileStatusVariant('HISTORICAL')).toBe('ghost')
  })

  it('marks an active team as successful', () => {
    expect(teamProfileStatusVariant('ACTIVE')).toBe('success')
  })

  it('marks an inactive team as a danger state', () => {
    expect(teamProfileStatusVariant('INACTIVE')).toBe('danger')
  })
})

describe('formatTeamLocation', () => {
  it('joins city and state when both are recorded', () => {
    expect(formatTeamLocation('Campinas', 'SP')).toBe('Campinas / SP')
  })

  it('drops the missing state cleanly', () => {
    expect(formatTeamLocation('Campinas', null)).toBe('Campinas')
  })

  it('drops the missing city cleanly', () => {
    expect(formatTeamLocation(null, 'SP')).toBe('SP')
  })

  it('falls back to an em dash when neither part exists', () => {
    expect(formatTeamLocation(null, null)).toBe('—')
  })
})

describe('team profile metric formatting', () => {
  it('shows an unmeasured average as an em dash', () => {
    expect(formatAverage(null)).toBe('—')
  })

  it('shows a measured zero average with one decimal', () => {
    expect(formatAverage(0)).toBe('0.0')
  })

  it('always prints an average with exactly one decimal place', () => {
    expect(formatAverage(38.286)).toBe('38.3')
    expect(formatAverage(13.5)).toBe('13.5')
  })

  it('shows an unmeasured differential as an em dash', () => {
    expect(formatSignedAverage(null)).toBe('—')
  })

  it('signs a positive differential with one decimal', () => {
    expect(formatSignedAverage(4.625)).toBe('+4.6')
  })

  it('keeps a negative differential sign as-is with one decimal', () => {
    expect(formatSignedAverage(-4.625)).toBe('-4.6')
  })

  it('leaves a zero differential unsigned with one decimal', () => {
    expect(formatSignedAverage(0)).toBe('0.0')
  })

  it('shows an unmeasured rate as an em dash', () => {
    expect(formatRate(null)).toBe('—')
  })

  it('renders a fraction as a trimmed percentage', () => {
    expect(formatRate(0.667)).toBe('66.7%')
  })

  it('renders a whole percentage without trailing decimals', () => {
    expect(formatRate(0.5)).toBe('50%')
  })
})
