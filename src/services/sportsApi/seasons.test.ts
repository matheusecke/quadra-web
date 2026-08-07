import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import { createSeason, getSeasons, listSeasonsPage } from './seasons'

const season = {
  id: 3, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE',
  createdAt: '2026-07-20T14:03:11.482Z', updatedAt: '2026-07-24T09:12:00.145Z',
}

const pageEnvelope = {
  data: [season],
  meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
  statusCode: 200,
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
})

describe('seasons adapter', () => {
  it('unwraps the paginated envelope into a plain list for selectors', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    expect(await getSeasons()).toEqual([season])
  })

  it('asks for a single page of 100 when used as a selector catalog', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    await getSeasons({ status: 'ACTIVE' })
    expect(apiMock.get).toHaveBeenCalledWith('/seasons', { params: { status: 'ACTIVE', page: 1, limit: 100 } })
  })

  it('keeps meta when the caller asks for one page', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    expect((await listSeasonsPage({ page: 2, limit: 20, q: '202' })).meta.currentPage).toBe(1)
  })

  it('returns the created season from the write envelope', async () => {
    apiMock.post.mockResolvedValue({ data: { data: season, statusCode: 201 } })
    expect(await createSeason({ label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31' })).toEqual(season)
  })
})
