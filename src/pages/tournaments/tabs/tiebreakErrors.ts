import { apiErrorCode } from '../../../services/apiError'

const TIEBREAK_ERROR_MESSAGES: Record<string, string> = {
  TIE_BLOCK_MISMATCH: 'A composição do empate mudou. Recarregue a classificação.',
  TOURNAMENT_NOT_MUTABLE: 'O campeonato está encerrado. Reabra-o para alterar o sorteio.',
  RECORD_NOT_FOUND: 'Campeonato não encontrado. Atualize a página.',
}

/** The block is recomputed on every request, so a result landing in between voids the draw
 *  the admin is submitting — the table on screen is already stale and has to be reloaded. */
export const isStaleTieBlock = (error: unknown) => apiErrorCode(error) === 'TIE_BLOCK_MISMATCH'

/** TiebreakPanel already blocks an incomplete permutation; the fallback is the net behind it. */
export const describeTiebreakError = (error: unknown) =>
  TIEBREAK_ERROR_MESSAGES[apiErrorCode(error) ?? ''] ?? 'Não foi possível registrar o sorteio. Tente novamente.'
