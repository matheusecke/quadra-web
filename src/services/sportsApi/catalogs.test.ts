import { describe, expect, it } from 'vitest'
import { getAthletes, getTeams } from './index'

describe('sports catalog seam', () => {
  it('returns the organization team catalog through a Promise', async () => {
    expect(await getTeams()).toContainEqual({ id: 1, name: 'Time 1', shortName: 'T01', city: 'Campinas' })
  })

  it('returns the organization athlete catalog through a Promise', async () => {
    expect(await getAthletes()).toContainEqual({
      id: 101, name: 'Rafael Moura', number: 4, position: 'PG', currentTeamId: 1, status: 'ACTIVE',
    })
  })
})
