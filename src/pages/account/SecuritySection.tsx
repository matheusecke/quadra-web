import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Card, Field, PasswordInput } from '../../components/ui'
import { useChangePasswordMutation } from '../../features/account/queries'
import { useAuth } from '../../hooks/useAuth'
import { PASSWORD_RULE_MESSAGE, isStrongPassword } from '../../features/account/password'
import { apiErrorCode } from '../../services/apiError'
import s from './account.module.css'

type PasswordErrors = {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export function SecuritySection() {
  const changePassword = useChangePasswordMutation()
  const { refreshOrganizations, refreshUser } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [formError, setFormError] = useState('')
  const [changed, setChanged] = useState(false)
  const [sessionRefreshError, setSessionRefreshError] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrors({})
    setFormError('')
    setChanged(false)
    setSessionRefreshError(false)

    const nextErrors: PasswordErrors = {}
    if (!currentPassword) nextErrors.currentPassword = 'Informe sua senha atual.'
    if (!isStrongPassword(newPassword)) nextErrors.newPassword = PASSWORD_RULE_MESSAGE
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'A confirmação não confere com a nova senha.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
    } catch (error) {
      if (apiErrorCode(error) === 'WRONG_CURRENT_PASSWORD') {
        setErrors({ currentPassword: 'Senha atual incorreta.' })
        return
      }
      setFormError('Não foi possível alterar sua senha. Tente novamente.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setChanged(true)
    try {
      await Promise.all([refreshUser(), refreshOrganizations()])
    } catch {
      setSessionRefreshError(true)
    }
  }

  return (
    <Card>
      <Card.Header>
        <h2 className={s.sectionTitle}>Segurança</h2>
        <p className={s.sectionHint}>
          Ao trocar a senha, as outras sessões são encerradas e você continua conectado aqui.
        </p>
      </Card.Header>
      <Card.Body>
        <form className={s.form} onSubmit={handleSubmit} noValidate>
          <div className={s.fields}>
            <div className={s.full}>
              <Field label="Senha atual" id="account-current-password" error={errors.currentPassword}>
                <PasswordInput
                  id="account-current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={Boolean(errors.currentPassword)}
                />
              </Field>
            </div>

            <Field label="Nova senha" id="account-new-password" error={errors.newPassword}>
              <PasswordInput
                id="account-new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                error={Boolean(errors.newPassword)}
              />
            </Field>

            <Field
              label="Confirmar nova senha"
              id="account-confirm-password"
              error={errors.confirmPassword}
            >
              <PasswordInput
                id="account-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                error={Boolean(errors.confirmPassword)}
              />
            </Field>
          </div>

          {changed && (
            <p className={s.formSuccess} role="status">
              Senha alterada. As outras sessões foram encerradas.
            </p>
          )}
          {sessionRefreshError && (
            <p className={s.formError} role="alert">
              Não foi possível atualizar o contexto da sessão. Recarregue a página.
            </p>
          )}
          {formError && (
            <p className={s.formError} role="alert">
              {formError}
            </p>
          )}

          <div className={s.actions}>
            <Button type="submit" variant="primary" loading={changePassword.isPending}>
              Trocar senha
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}
