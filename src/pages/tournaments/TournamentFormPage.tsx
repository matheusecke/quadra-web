import { useEffect, useReducer } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Field } from '../../components/ui/Field/Field'
import { InlineCreateField } from '../../features/sports/components/InlineCreateField'
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
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const isEdit = Boolean(tournamentId)

  const [state, dispatch] = useReducer(tournamentFormReducer, undefined, initialTournamentFormState)

  const { data: seasons } = useSeasonsQuery()
  const { data: categories } = useCategoriesQuery()
  const { data: existing } = useTournamentQuery(tournamentId)
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

  const errors = validateTournamentForm(state)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (errors.name || errors.seasonId || errors.dateRange) return
    const input = {
      name: state.name.trim(),
      seasonId: state.seasonId as string,
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
          <select
            id="tournament-format"
            className={s.select}
            value={state.format}
            onChange={(e) => dispatch({ type: 'setField', field: 'format', value: e.target.value as TournamentFormat })}
          >
            {FORMAT_OPTIONS.map((format) => (
              <option key={format} value={format}>{TOURNAMENT_FORMAT_LABELS[format]}</option>
            ))}
          </select>
        </Field>

        <div className={s.dates}>
          <Field
            label="Início"
            inputProps={{ type: 'date', value: state.startDate, onChange: (e) => dispatch({ type: 'setField', field: 'startDate', value: e.target.value }) }}
          />
          <Field
            label="Fim"
            error={errors.dateRange}
            inputProps={{ type: 'date', value: state.endDate, onChange: (e) => dispatch({ type: 'setField', field: 'endDate', value: e.target.value }) }}
          />
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
          <Button type="button" variant="ghost" onClick={() => navigate('/tournaments')}>
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
