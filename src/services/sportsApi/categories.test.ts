import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../api', () => ({ default: apiMock }))

import { createCategory, getCategories, listCategoriesPage } from './categories'

const unordered = { id: 4, name: 'Adulto Feminino', slug: 'adulto-feminino', sortOrder: null, status: 'ACTIVE' }

const pageEnvelope = {
  data: [{ id: 1, name: 'Sub-19', slug: 'sub-19', sortOrder: 1, status: 'ACTIVE' }, unordered],
  meta: { totalItems: 2, itemCount: 2, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
  links: { first: '?page=1', previous: null, next: null, last: '?page=1' },
  statusCode: 200,
}

beforeEach(() => {
  apiMock.get.mockReset()
  apiMock.post.mockReset()
})

describe('tournament categories adapter', () => {
  it('keeps the order the API returned, with the unordered category last', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    expect((await getCategories()).at(-1)).toEqual(unordered)
  })

  it('sends the status filter to the categories route', async () => {
    apiMock.get.mockResolvedValue({ data: pageEnvelope })
    await listCategoriesPage({ page: 1, limit: 20, status: 'ACTIVE' })
    expect(apiMock.get).toHaveBeenCalledWith('/tournament-categories', { params: { page: 1, limit: 20, status: 'ACTIVE' } })
  })

  it('returns the created category, including a null sortOrder', async () => {
    apiMock.post.mockResolvedValue({ data: { data: unordered, statusCode: 201 } })
    expect(await createCategory({ name: 'Adulto Feminino' })).toEqual(unordered)
  })
})
