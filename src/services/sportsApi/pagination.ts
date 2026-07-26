import type { PaginatedResponse } from '../../types/admin'

/** Sequential paging keeps result order deterministic and stops at the server-provided count. */
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const items: T[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await fetchPage(page)
    items.push(...response.data)
    totalPages = response.meta.totalPages
    page += 1
  } while (page <= totalPages)

  return items
}
