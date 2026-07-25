import api from '../api'
import type { EntityStatus, PaginatedResponse } from '../../types/admin'
import type { ApiResponse } from '../../types/api'
import type { TournamentCategory } from '../../features/sports/types'
import type { CreateCategoryInput } from './types'

export interface ListCategoriesParams {
  page?: number
  limit?: number
  /** Busca parcial, case-insensitive, sobre `name`. */
  q?: string
  status?: EntityStatus
}

/** Teto de `limit` do backend. */
const CATALOG_PAGE_LIMIT = 100

export const listCategoriesPage = (params: ListCategoriesParams = {}) =>
  api.get<PaginatedResponse<TournamentCategory>>('/tournament-categories', { params }).then((r) => r.data)

// ponytail: mesma página única dos seletores de temporada — a API já devolve ordenado (sortOrder ASC NULLS LAST, name, id).
export const getCategories = (params: Omit<ListCategoriesParams, 'page' | 'limit'> = {}) =>
  listCategoriesPage({ ...params, page: 1, limit: CATALOG_PAGE_LIMIT }).then((r) => r.data)

export const createCategory = (input: CreateCategoryInput) =>
  api.post<ApiResponse<TournamentCategory>>('/tournament-categories', input).then((r) => r.data.data)
