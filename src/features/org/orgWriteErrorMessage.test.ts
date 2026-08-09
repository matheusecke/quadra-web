import { describe, expect, it } from 'vitest'
import { orgWriteErrorMessage } from './orgWriteErrorMessage'

const apiFailure = (status: number, message: string) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { error: { code: 'ANY', message } } },
  })

describe('orgWriteErrorMessage', () => {
  it.each([
    [403, 'Insufficient permissions.', 'Seu papel atual não permite executar esta ação.'],
    [403, 'You can only manage users from your own team', 'Você só pode gerenciar usuários da sua própria equipe.'],
    [403, 'You cannot change your own organization administrator affiliation', 'Você não pode alterar o seu próprio vínculo de administrador da organização.'],
    [404, 'User not found', 'Usuário ativo não encontrado.'],
    [404, 'Affiliation not found', 'Vínculo não encontrado nesta organização.'],
    [409, 'User already has an active affiliation', 'Este usuário já possui um vínculo ativo nesta organização.'],
    [409, 'User already has a pending invite', 'Este usuário já possui um convite pendente nesta organização.'],
    [422, 'Team affiliation is inactive; activate it before inviting users', 'Esta equipe está inativa nesta organização. Ative a equipe pela lista antes de convidar usuários.'],
    [422, 'Invite has expired', 'Este convite expirou. Reenvie o convite para gerar um novo prazo.'],
    [422, 'Invite is no longer pending', 'Este convite já foi respondido. Atualize a lista e tente novamente.'],
  ])('translates %i %s', (status, message, expected) => {
    expect(orgWriteErrorMessage(apiFailure(status, message), 'invite')).toBe(expected)
  })

  it('falls back to the validation copy for any other 400', () => {
    expect(orgWriteErrorMessage(apiFailure(400, 'teamId should not exist'), 'teamOnboarding')).toBe(
      'Há dados inválidos no formulário. Revise os campos e tente novamente.',
    )
  })

  it('falls back to the conflict copy for any other 409', () => {
    expect(orgWriteErrorMessage(apiFailure(409, 'Concurrent write'), 'activate')).toBe(
      'Outra alteração ocorreu ao mesmo tempo. Atualize a lista e tente novamente.',
    )
  })

  it('falls back to the transition copy for any other 422', () => {
    expect(orgWriteErrorMessage(apiFailure(422, 'Affiliation is not active'), 'deactivate')).toBe(
      'Esta ação não é válida para o estado atual do registro. Atualize a lista e tente novamente.',
    )
  })

  it('uses the operation fallback when the failure carries no response', () => {
    expect(orgWriteErrorMessage(new Error('network'), 'resendAll')).toBe(
      'Não foi possível reenviar os convites desta equipe.',
    )
  })

  it('uses the operation fallback for an unmapped server failure', () => {
    expect(orgWriteErrorMessage(apiFailure(500, 'Internal server error'), 'teamOnboarding')).toBe(
      'Não foi possível adicionar a equipe.',
    )
  })
})
