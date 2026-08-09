import { apiErrorMessage, apiErrorStatus } from '../../services/apiError'

export type OrgWriteOperation =
  | 'invite'
  | 'teamOnboarding'
  | 'activate'
  | 'deactivate'
  | 'cancel'
  | 'cancelTeam'
  | 'resend'
  | 'resendAll'
  | 'updateMembership'
  | 'updateTeam'

const key = (status: number, message: string) => `${status} ${message}`

// Keyed on HTTP status + the English message the API actually emits (see Decision 9 for the
// OrgRoleGuard pin). Never on an error code.
const translations = new Map<string, string>([
  [key(403, 'Insufficient permissions.'), 'Seu papel atual não permite executar esta ação.'],
  [key(403, 'You can only manage users from your own team'), 'Você só pode gerenciar usuários da sua própria equipe.'],
  [key(403, 'You cannot change your own organization administrator affiliation'), 'Você não pode alterar o seu próprio vínculo de administrador da organização.'],
  [key(404, 'User not found'), 'Usuário ativo não encontrado.'],
  [key(404, 'Affiliation not found'), 'Vínculo não encontrado nesta organização.'],
  [key(409, 'User already has an active affiliation'), 'Este usuário já possui um vínculo ativo nesta organização.'],
  [key(409, 'User already has a pending invite'), 'Este usuário já possui um convite pendente nesta organização.'],
  [key(422, 'Team affiliation is inactive; activate it before inviting users'), 'Esta equipe está inativa nesta organização. Ative a equipe pela lista antes de convidar usuários.'],
  [key(422, 'Invite has expired'), 'Este convite expirou. Reenvie o convite para gerar um novo prazo.'],
  [key(422, 'Invite is no longer pending'), 'Este convite já foi respondido. Atualize a lista e tente novamente.'],
])

const statusFallbacks = new Map<number, string>([
  [400, 'Há dados inválidos no formulário. Revise os campos e tente novamente.'],
  [409, 'Outra alteração ocorreu ao mesmo tempo. Atualize a lista e tente novamente.'],
  [422, 'Esta ação não é válida para o estado atual do registro. Atualize a lista e tente novamente.'],
])

const operationFallbacks: Record<OrgWriteOperation, string> = {
  invite: 'Não foi possível enviar o convite.',
  teamOnboarding: 'Não foi possível adicionar a equipe.',
  activate: 'Não foi possível ativar o vínculo.',
  deactivate: 'Não foi possível desativar o vínculo.',
  cancel: 'Não foi possível cancelar o convite.',
  cancelTeam: 'Não foi possível cancelar a inclusão desta equipe.',
  resend: 'Não foi possível reenviar o convite.',
  resendAll: 'Não foi possível reenviar os convites desta equipe.',
  updateMembership: 'Não foi possível salvar camisa e posição.',
  updateTeam: 'Não foi possível salvar o cadastro da equipe.',
}

export function orgWriteErrorMessage(error: unknown, operation: OrgWriteOperation): string {
  const status = apiErrorStatus(error)
  const message = apiErrorMessage(error)

  if (status === undefined) return operationFallbacks[operation]

  if (message !== undefined) {
    const exact = translations.get(key(status, message))
    if (exact !== undefined) return exact
  }

  return statusFallbacks.get(status) ?? operationFallbacks[operation]
}
