import axios from 'axios'

/** Código do envelope de erro do tcc-api (`{ error: { code } }`), quando a falha veio da API. */
export function apiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined
  const payload = error.response?.data as { error?: { code?: string } } | undefined
  return payload?.error?.code
}
