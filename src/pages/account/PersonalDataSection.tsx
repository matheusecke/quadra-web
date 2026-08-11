import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Button,
  Card,
  DateTimeField,
  ErrorState,
  Field,
  HeightField,
  Input,
  LoadingState,
} from '../../components/ui'
import { useMyProfileQuery, useUpdateMyProfileMutation } from '../../features/account/queries'
import { useAuth } from '../../hooks/useAuth'
import { apiErrorData } from '../../services/apiError'
import type { MyProfile, UpdateMyProfileInput } from '../../types/api'
import s from './account.module.css'

type FormState = {
  name: string
  birthDate: string
  heightDigits: string
}

const toFormState = (profile: MyProfile): FormState => ({
  name: profile.name,
  birthDate: profile.birthDate,
  heightDigits: profile.heightCm == null ? '' : String(profile.heightCm),
})

// An absent heightCm keeps the stored value; an explicit null clears it.
function buildPatch(form: FormState, loaded: FormState): UpdateMyProfileInput {
  const patch: UpdateMyProfileInput = {}
  if (form.name.trim() !== loaded.name) patch.name = form.name.trim()
  if (form.birthDate !== loaded.birthDate) patch.birthDate = form.birthDate
  if (form.heightDigits !== loaded.heightDigits) {
    patch.heightCm = form.heightDigits ? parseInt(form.heightDigits, 10) : null
  }
  return patch
}

const SERVER_FIELD_ERRORS: Record<string, string> = {
  name: 'Informe seu nome.',
  birthDate: 'Use uma data de nascimento real, no passado e nos últimos 120 anos.',
  heightCm: 'A altura deve estar entre 50 e 250 cm.',
}

export function PersonalDataSection() {
  const { data: profile, isPending, isError, refetch } = useMyProfileQuery()

  if (isError) {
    return (
      <ErrorState title="Não foi possível carregar seus dados." onRetry={() => void refetch()} />
    )
  }

  if (isPending || !profile) {
    return <LoadingState message="Carregando seus dados…" />
  }

  return <PersonalDataForm key={profile.id} profile={profile} />
}

function PersonalDataForm({ profile }: { profile: MyProfile }) {
  const { refreshUser } = useAuth()
  const updateProfile = useUpdateMyProfileMutation()
  const [loaded, setLoaded] = useState(() => toFormState(profile))
  const [form, setForm] = useState(() => toFormState(profile))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)

  const patch = buildPatch(form, loaded)
  const isDirty = Object.keys(patch).length > 0
  const setField = (field: keyof FormState, value: string) =>
    setForm((current) => (current ? { ...current, [field]: value } : current))

  const handleCancel = () => {
    setForm(loaded)
    setFieldErrors({})
    setFormError('')
    setSaved(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFieldErrors({})
    setFormError('')
    setSaved(false)

    if (!form.name.trim()) {
      setFieldErrors({ name: SERVER_FIELD_ERRORS.name })
      return
    }
    if (!form.birthDate) {
      setFieldErrors({ birthDate: 'Informe sua data de nascimento.' })
      return
    }

    try {
      const updated = await updateProfile.mutateAsync(patch)
      setLoaded(toFormState(updated))
      setForm(toFormState(updated))
      setSaved(true)
    } catch (error) {
      const fields = Object.keys(apiErrorData(error) ?? {}).filter(
        (key) => key in SERVER_FIELD_ERRORS,
      )
      if (fields.length === 0) {
        setFormError('Não foi possível salvar seus dados. Tente novamente.')
        return
      }
      setFieldErrors(Object.fromEntries(fields.map((key) => [key, SERVER_FIELD_ERRORS[key]])))
      return
    }

    // The sidebar reads the name from the auth context, not from this cache.
    try {
      await refreshUser()
    } catch {
      setFormError('Dados salvos, mas não foi possível atualizar o nome na navegação.')
    }
  }

  return (
    <Card>
      <Card.Header>
        <h2 className={s.sectionTitle}>Dados pessoais</h2>
        <p className={s.sectionHint}>Usados no seu perfil de atleta e no cálculo da idade.</p>
      </Card.Header>
      <Card.Body>
        <form className={s.form} onSubmit={handleSubmit} noValidate>
          <div className={s.fields}>
            <div className={s.full}>
              <Field
                label="E-mail"
                id="account-email"
                hint="Para alterar o e-mail, fale com o administrador da plataforma."
              >
                <Input id="account-email" value={profile.email} disabled fullWidth readOnly />
              </Field>
            </div>

            <div className={s.full}>
              <Field
                label="Nome"
                id="account-name"
                error={fieldErrors.name}
                inputProps={{
                  id: 'account-name',
                  value: form.name,
                  onChange: (e) => setField('name', e.target.value),
                }}
              />
            </div>

            <Field label="Data de nascimento" id="account-birth-date" error={fieldErrors.birthDate}>
              <DateTimeField
                id="account-birth-date"
                type="date"
                value={form.birthDate}
                error={Boolean(fieldErrors.birthDate)}
                onChange={(value) => setField('birthDate', value)}
              />
            </Field>

            <Field label="Altura" id="account-height" error={fieldErrors.heightCm}>
              <HeightField
                id="account-height"
                digits={form.heightDigits}
                error={Boolean(fieldErrors.heightCm)}
                onDigitsChange={(digits) => setField('heightDigits', digits)}
              />
            </Field>
          </div>

          {saved && (
            <p className={s.formSuccess} role="status">
              Dados atualizados.
            </p>
          )}
          {formError && (
            <p className={s.formError} role="alert">
              {formError}
            </p>
          )}

          <div className={s.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={!isDirty || updateProfile.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty || updateProfile.isPending}
              loading={updateProfile.isPending}
            >
              Salvar
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}
