import api from '../api'
import type { PaginatedResponse } from '../../types/admin'
import type { ApiResponse } from '../../types/api'
import type { Season, SeasonStatus } from '../../features/sports/types'
import type { CreateSeasonInput } from './types'

export interface ListSeasonsParams {
  page?: number
  limit?: number
  /** Busca parcial, case-insensitive, sobre `label`. */
  q?: string
  status?: SeasonStatus
  /** Repetido na query string (`?ids=1&ids=2`), nunca CSV — contrato §37. */
  ids?: number[]
}

/** Teto de `limit` do backend. */
const CATALOG_PAGE_LIMIT = 100

export const listSeasonsPage = (params: ListSeasonsParams = {}) =>
  api.get<PaginatedResponse<Season>>('/seasons', { params }).then((r) => r.data)

// ponytail: uma página de 100 cobre os seletores; se uma organização passar disso, o consumidor precisa paginar.
export const getSeasons = (params: Omit<ListSeasonsParams, 'page' | 'limit'> = {}) =>
  listSeasonsPage({ ...params, page: 1, limit: CATALOG_PAGE_LIMIT }).then((r) => r.data)

export const createSeason = (input: CreateSeasonInput) =>
  api.post<ApiResponse<Season>>('/seasons', input).then((r) => r.data.data)
