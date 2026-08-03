import { apiErrorCode, apiErrorMessage } from '../../services/apiError'

export type MatchWriteOperation = 'draft' | 'result' | 'reopen'

const key = (code: string, message: string) => `${code}\u0000${message}`

const translations = new Map<string, string>([
  [key('VALIDATION_ERROR', 'Invalid data in request.'), 'Há dados inválidos na súmula. Revise os campos e tente novamente.'],
  [key('RECORD_NOT_FOUND', 'Match not found'), 'Partida não encontrada.'],
  [key('RECORD_NOT_FOUND', 'Tournament roster not found'), 'Um atleta da súmula não foi encontrado no elenco do torneio.'],
  [key('INVALID_STATUS_TRANSITION', 'Drafts can only be saved for scheduled or live matches.'), 'Esta partida não aceita mais alterações de rascunho.'],
  [key('INVALID_STATUS_TRANSITION', 'Results can only be submitted for scheduled or live matches.'), 'Esta partida não aceita mais o lançamento de resultado.'],
  [key('INVALID_STATUS_TRANSITION', 'Only a finished match can be reopened.'), 'Somente uma partida finalizada pode ser reaberta.'],
  [key('TOURNAMENT_NOT_MUTABLE', 'Match scoresheets cannot be changed for a cancelled tournament.'), 'A súmula não pode ser alterada porque o torneio está cancelado.'],
  [key('CONCURRENT_MODIFICATION', 'The resource changed during this operation. Retry the request.'), 'A partida foi alterada por outra pessoa. Revise os dados atualizados e tente novamente.'],
  [key('INVALID_MATCH_PERIODS', 'Periods must be contiguous and use the type required by their number.'), 'Os períodos devem ser sequenciais: quatro regulares e, depois, apenas prorrogações.'],
  [key('INVALID_MATCH_PERIODS', 'A normal result requires four complete regular periods and a non-tied score.'), 'O resultado normal exige quatro períodos regulares completos e não pode terminar empatado.'],
  [key('INVALID_MATCH_PERIODS', 'A default result requires at least one period.'), 'O resultado por abandono exige pelo menos um período.'],
  [key('INVALID_OFFENDING_TEAM', 'The offending team must be one of the match participants.'), 'A equipe infratora deve ser uma das participantes da partida.'],
  [key('INVALID_PLAYER_STATS', 'Each player can appear only once in match statistics.'), 'Cada atleta pode aparecer apenas uma vez nas estatísticas.'],
  [key('INVALID_PLAYER_STATS', 'Each tracked statistic must be provided for every player or be null for every player.'), 'Cada estatística deve ser informada para todos os atletas ou marcada como não acompanhada para todos.'],
  [key('INVALID_PLAYER_STATS', 'Made shots cannot exceed attempted shots.'), 'Arremessos convertidos não podem exceder as tentativas.'],
  [key('INVALID_MATCH_ROSTER', 'Every player statistic must reference an athlete from one of the match teams.'), 'Todas as estatísticas devem pertencer a atletas dos times desta partida.'],
  [key('INVALID_MATCH_MVP', 'The match MVP must be present in the resulting player statistics.'), 'O MVP precisa estar entre os atletas enviados nas estatísticas.'],
  [key('MATCH_TEAMS_MISMATCH', 'The match participants do not match the bracket slot participants.'), 'Os participantes da partida não correspondem aos participantes da vaga do chaveamento.'],
])

const fallbacks: Record<MatchWriteOperation, string> = {
  draft: 'Não foi possível salvar o rascunho.',
  result: 'Não foi possível finalizar a partida.',
  reopen: 'Não foi possível reabrir a partida.',
}

export function matchWriteErrorMessage(
  error: unknown,
  operation: MatchWriteOperation,
): string {
  const code = apiErrorCode(error)
  const message = apiErrorMessage(error)
  return code && message ? translations.get(key(code, message)) ?? fallbacks[operation] : fallbacks[operation]
}
