import { useEffect, useReducer, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { DateTimeField } from '../../components/ui/DateTimeField/DateTimeField'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Field } from '../../components/ui/Field/Field'
import { InlineCreateField } from '../../features/sports/components/InlineCreateField'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { toDayInput } from '../../features/sports/tournamentDates'
import {
  useCategoriesQuery,
  useCreateCategory,
  useCreateTournament,
  useSeasonsQuery,
  useTournamentQuery,
  useUpdateTournament,
} from '../../features/sports/queries'
import { TOURNAMENT_FORMAT_LABELS, TOURNAMENT_STATUS_LABELS } from '../../features/sports/sportsUtils'
import type { TournamentFormat } from '../../features/sports/types'
import { apiErrorCode } from '../../services/apiError'
import type { EditableTournamentStatus } from '../../services/sportsApi/types'
import {
  initialTournamentFormState,
  toCreateInput,
  toUpdateInput,
  tournamentFormReducer,
  validateTournamentForm,
} from './tournamentForm.reducer'
import s from './TournamentFormPage.module.css'

const FORMAT_OPTIONS = Object.keys(TOURNAMENT_FORMAT_LABELS) as TournamentFormat[]
const EDITABLE_STATUS_OPTIONS: EditableTournamentStatus[] = ['DRAFT', 'REGISTRATION', 'IN_PROGRESS', 'CANCELLED']

const SAVE_ERRORS: Record<string, string> = {
  DUPLICATE_RECORD: 'Já existe um campeonato com esse identificador.',
  INVALID_REFERENCE: 'Temporada ou categoria não encontrada nesta organização.',
  INVALID_DATE_RANGE: 'A data de início deve ser anterior à de fim.',
  INVALID_STATUS_TRANSITION: 'Um campeonato encerrado precisa ser reaberto antes de mudar de status.',
  INVALID_CHAMPION: 'Não é possível mudar o formato de um campeonato com campeão declarado.',
  VALIDATION_ERROR: 'Verifique os campos preenchidos.',
}

export function TournamentFormPage() {
  const navigate = useNavigate()
  const { tournamentId: rawTournamentId } = useParams<{ tournamentId: string }>()
  const tournamentId = parsePositiveId(rawTournamentId)
  const isEdit = Boolean(tournamentId)

  const [state, dispatch] = useReducer(tournamentFormReducer, undefined, initialTournamentFormState)
  const [formError, setFormError] = useState('')

  const { data: seasons } = useSeasonsQuery({ status: 'ACTIVE' })
  const { data: categories } = useCategoriesQuery()
  const { data: existing } = useTournamentQuery(tournamentId ?? undefined)
  const createCategory = useCreateCategory()
  const createTournament = useCreateTournament()
  const updateTournament = useUpdateTournament()
  const isCompleted = existing?.status === 'COMPLETED'

  useEffect(() => {
    if (!existing) return
    dispatch({
      type: 'load',
      state: {
        name: existing.name,
        seasonId: existing.seasonId,
        categoryId: existing.categoryId,
        format: existing.format,
        status: existing.status === 'COMPLETED' ? 'IN_PROGRESS' : existing.status,
        startsAt: toDayInput(existing.startsAt),
        endsAt: toDayInput(existing.endsAt),
        registrationStartsAt: toDayInput(existing.registrationStartsAt),
        registrationEndsAt: toDayInput(existing.registrationEndsAt),
        regulation: existing.regulation ?? '',
      },
    })
  }, [existing])

  // A API devolve as temporadas por startDate DESC: a primeira ativa é a mais recente (contrato §2).
  useEffect(() => {
    if (isEdit || state.seasonId != null || !seasons?.length) return
    dispatch({ type: 'setField', field: 'seasonId', value: seasons[0].id })
  }, [isEdit, seasons, state.seasonId])

  if (rawTournamentId != null && tournamentId == null) {
    return <ErrorState title="ID de campeonato inválido." />
  }

  const errors = validateTournamentForm(state)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (errors.name || errors.seasonId || errors.dateRange || errors.registrationRange) return
    setFormError('')
    try {
      if (isEdit && tournamentId) {
        await updateTournament.mutateAsync({ id: tournamentId, input: toUpdateInput(state, isCompleted) })
        navigate(`/tournaments/${tournamentId}`)
      } else {
        const created = await createTournament.mutateAsync(toCreateInput(state))
        navigate(`/tournaments/${created.id}`)
      }
    } catch (error) {
      setFormError(SAVE_ERRORS[apiErrorCode(error) ?? ''] ?? 'Não foi possível salvar o campeonato.')
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Esportivo</p>
        <h1 className={s.title}>{isEdit ? 'Editar campeonato' : 'Novo campeonato'}</h1>
      </header>

      <form className={s.form} onSubmit={handleSubmit}>
        <Field
          label="Nome"
          error={errors.name}
          inputProps={{ value: state.name, onChange: (e) => dispatch({ type: 'setField', field: 'name', value: e.target.value }) }}
        />

        <Field label="Temporada" id="tournament-season" hint="Temporadas são cadastradas em Esportivo › Temporadas.">
          <Combobox
            id="tournament-season"
            options={(seasons ?? []).map((season) => ({ value: String(season.id), label: season.label }))}
            value={state.seasonId == null ? null : String(state.seasonId)}
            onChange={(raw) => {
              const id = parsePositiveId(raw)
              if (id != null) dispatch({ type: 'setField', field: 'seasonId', value: id })
            }}
            placeholder="Selecione…"
          />
        </Field>

        <InlineCreateField
          label="Categoria"
          createLabel="criar categoria"
          value={state.categoryId}
          options={(categories ?? []).map((category) => ({ id: category.id, label: category.name }))}
          onChange={(id) => dispatch({ type: 'setField', field: 'categoryId', value: id })}
          onCreate={(name) => createCategory.mutateAsync({ name })}
        />

        <Field label="Formato" id="tournament-format">
          <Combobox
            id="tournament-format"
            options={FORMAT_OPTIONS.map((format) => ({ value: format, label: TOURNAMENT_FORMAT_LABELS[format] }))}
            value={state.format}
            onChange={(value) => dispatch({ type: 'setField', field: 'format', value: value as TournamentFormat })}
          />
        </Field>

        <Field
          label="Status"
          id="tournament-status"
          hint={isCompleted ? 'Campeonato encerrado. Use "Reabrir campeonato" no detalhe para voltar a Em andamento.' : undefined}
        >
          <Combobox
            id="tournament-status"
            disabled={isCompleted}
            options={EDITABLE_STATUS_OPTIONS.map((value) => ({ value, label: TOURNAMENT_STATUS_LABELS[value] }))}
            value={isCompleted ? null : state.status}
            onChange={(value) => dispatch({ type: 'setField', field: 'status', value: value as EditableTournamentStatus })}
            placeholder={isCompleted ? TOURNAMENT_STATUS_LABELS.COMPLETED : undefined}
          />
        </Field>

        <div className={s.dates}>
          <Field label="Início" id="tournament-start">
            <DateTimeField id="tournament-start" type="date" value={state.startsAt} onChange={(value) => dispatch({ type: 'setField', field: 'startsAt', value })} />
          </Field>
          <Field label="Fim" id="tournament-end" error={errors.dateRange}>
            <DateTimeField id="tournament-end" type="date" value={state.endsAt} onChange={(value) => dispatch({ type: 'setField', field: 'endsAt', value })} />
          </Field>
        </div>

        <div className={s.dates}>
          <Field label="Inscrições abrem" id="tournament-reg-start">
            <DateTimeField id="tournament-reg-start" type="date" value={state.registrationStartsAt} onChange={(value) => dispatch({ type: 'setField', field: 'registrationStartsAt', value })} />
          </Field>
          <Field label="Inscrições fecham" id="tournament-reg-end" error={errors.registrationRange}>
            <DateTimeField id="tournament-reg-end" type="date" value={state.registrationEndsAt} onChange={(value) => dispatch({ type: 'setField', field: 'registrationEndsAt', value })} />
          </Field>
        </div>

        <Field label="Regulamento" id="tournament-regulation">
          <textarea
            id="tournament-regulation"
            className={s.textarea}
            value={state.regulation}
            onChange={(e) => dispatch({ type: 'setField', field: 'regulation', value: e.target.value })}
            rows={4}
          />
        </Field>

        {formError && <p className={s.formError} role="alert">{formError}</p>}

        <div className={s.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEdit && tournamentId ? `/tournaments/${tournamentId}` : '/tournaments')}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={createTournament.isPending || updateTournament.isPending}>
            {isEdit ? 'Salvar alterações' : 'Criar campeonato'}
          </Button>
        </div>
      </form>
    </div>
  )
}
