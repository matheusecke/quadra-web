import { useState } from 'react'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { orgWriteErrorMessage } from '../../features/org/orgWriteErrorMessage'
import { useUpdateTeamMutation } from '../../features/org/queries'
import type { TeamProfileIdentity } from '../../features/sports/types'
import s from './orgForm.module.css'

export function TeamRegistrationForm({ team }: { team: TeamProfileIdentity }) {
  const [name, setName] = useState(team.name)
  const [shortName, setShortName] = useState(team.shortName)
  const [city, setCity] = useState(team.city ?? '')
  const [state, setState] = useState(team.state ?? '')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const mutation = useUpdateTeamMutation(team.id)
  const canSubmit = name.trim() !== '' && shortName.trim() !== ''

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setErrorMessage(null)
    setIsSaved(false)
    mutation.mutate(
      {
        name: name.trim(),
        shortName: shortName.trim(),
        city: city.trim() || null,
        state: state.trim() || null,
      },
      {
        onSuccess: () => setIsSaved(true),
        onError: (error) => setErrorMessage(orgWriteErrorMessage(error, 'updateTeam')),
      },
    )
  }

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <p className={s.hint}>
        Estes dados identificam sua equipe em toda a plataforma. Se ela estiver vinculada a outras
        organizações, as alterações também serão exibidas nelas.
      </p>
      <Field
        label="Nome"
        id="registration-name"
        required
        inputProps={{
          id: 'registration-name',
          value: name,
          onChange: (event) => setName(event.target.value),
          disabled: mutation.isPending,
        }}
      />
      <Field
        label="Sigla"
        id="registration-short-name"
        required
        inputProps={{
          id: 'registration-short-name',
          value: shortName,
          onChange: (event) => setShortName(event.target.value),
          disabled: mutation.isPending,
        }}
      />
      <Field
        label="Cidade"
        id="registration-city"
        inputProps={{
          id: 'registration-city',
          value: city,
          onChange: (event) => setCity(event.target.value),
          disabled: mutation.isPending,
        }}
      />
      <Field
        label="Estado"
        id="registration-state"
        inputProps={{
          id: 'registration-state',
          value: state,
          onChange: (event) => setState(event.target.value),
          disabled: mutation.isPending,
        }}
      />
      {errorMessage && (
        <p className={s.error} role="alert">
          {errorMessage}
        </p>
      )}
      {isSaved && !errorMessage && (
        <p className={s.hint} role="status">
          Cadastro atualizado.
        </p>
      )}
      <div className={s.actions}>
        <Button type="submit" disabled={!canSubmit || mutation.isPending} loading={mutation.isPending}>
          Salvar
        </Button>
      </div>
    </form>
  )
}
