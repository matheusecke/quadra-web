import { useEffect, useReducer } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { DateTimeField } from '../../components/ui/DateTimeField/DateTimeField'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Field } from '../../components/ui/Field/Field'
import { InlineCreateField } from '../../features/sports/components/InlineCreateField'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import {
  useCategoriesQuery,
  useCreateCategory,
  useCreateSeason,
  useCreateTournament,
  useSeasonsQuery,
  useTournamentQuery,
  useUpdateTournament,
} from '../../features/sports/queries'
import { TOURNAMENT_FORMAT_LABELS } from '../../features/sports/sportsUtils'
import type { TournamentFormat } from '../../features/sports/types'
import {
  initialTournamentFormState,
  tournamentFormReducer,
  validateTournamentForm,
} from './tournamentForm.reducer'
import s from './TournamentFormPage.module.css'

const FORMAT_OPTIONS = Object.keys(TOURNAMENT_FORMAT_LABELS) as TournamentFormat[]

export function TournamentFormPage() {
  const navigate = useNavigate()
  const { tournamentId: rawTournamentId } = useParams<{ tournamentId: string }>()
  const tournamentId = parsePositiveId(rawTournamentId)
  const isEdit = Boolean(tournamentId)

  const [state, dispatch] = useReducer(tournamentFormReducer, undefined, initialTournamentFormState)

  const { data: seasons } = useSeasonsQuery()
  const { data: categories } = useCategoriesQuery()
  const { data: existing } = useTournamentQuery(tournamentId ?? undefined)
  const createSeason = useCreateSeason()
  const createCategory = useCreateCategory()
  const createTournament = useCreateTournament()
  const updateTournament = useUpdateTournament()

  useEffect(() => {
    if (!existing) return
    dispatch({
      type: 'load',
      state: {
        name: existing.name,
        seasonId: existing.seasonId,
        categoryId: existing.categoryId,
        format: existing.format,
        startDate: existing.startDate,
        endDate: existing.endDate,
        regulation: existing.regulation,
      },
    })
  }, [existing])

  if (rawTournamentId != null && tournamentId == null) {
    return <ErrorState title="ID de campeonato inválido." />
  }

  const errors = validateTournamentForm(state)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (errors.name || errors.seasonId || errors.dateRange) return
    const input = {
      name: state.name.trim(),
      seasonId: state.seasonId!,
      categoryId: state.categoryId,
      format: state.format,
      startDate: state.startDate,
      endDate: state.endDate,
      regulation: state.regulation || undefined,
    }
    if (isEdit && tournamentId) {
      await updateTournament.mutateAsync({ id: tournamentId, input })
      navigate(`/tournaments/${tournamentId}`)
    } else {
      const created = await createTournament.mutateAsync(input)
      navigate(`/tournaments/${created.id}`)
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

        <InlineCreateField
          label="Temporada"
          createLabel="criar temporada"
          value={state.seasonId}
          options={(seasons ?? []).map((season) => ({ id: season.id, label: season.label }))}
          onChange={(id) => dispatch({ type: 'setField', field: 'seasonId', value: id })}
          onCreate={(label) => createSeason.mutateAsync({ label, startDate: '', endDate: '' })}
        />

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

        <div className={s.dates}>
          <Field label="Início" id="tournament-start">
            <DateTimeField id="tournament-start" type="date" value={state.startDate} onChange={(value) => dispatch({ type: 'setField', field: 'startDate', value })} />
          </Field>
          <Field label="Fim" id="tournament-end" error={errors.dateRange}>
            <DateTimeField id="tournament-end" type="date" value={state.endDate} onChange={(value) => dispatch({ type: 'setField', field: 'endDate', value })} />
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
