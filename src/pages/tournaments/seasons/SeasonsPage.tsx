import { useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarRange } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { DateTimeField } from '../../../components/ui/DateTimeField/DateTimeField'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Field } from '../../../components/ui/Field/Field'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/ui/Table/Table'
import { useCreateSeason, useSeasonsQuery } from '../../../features/sports/queries'
import { formatDate } from '../../../features/sports/sportsUtils'
import type { SeasonStatus } from '../../../features/sports/types'
import s from './SeasonsPage.module.css'

const SEASON_STATUS: Record<SeasonStatus, { label: string; variant: 'success' | 'ghost' }> = {
  ACTIVE: { label: 'Ativa', variant: 'success' },
  ARCHIVED: { label: 'Arquivada', variant: 'ghost' },
}

export function SeasonsPage() {
  const { data: seasons, isPending, isError, refetch } = useSeasonsQuery()
  const createSeason = useCreateSeason()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formError, setFormError] = useState('')

  const closeForm = () => {
    setIsFormOpen(false)
    setLabel('')
    setStartDate('')
    setEndDate('')
    setFormError('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!label.trim() || !startDate || !endDate) {
      setFormError('Preencha rótulo, início e fim.')
      return
    }
    await createSeason.mutateAsync({ label: label.trim(), startDate, endDate })
    closeForm()
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>Esportivo</p>
          <h1 className={s.title}>Temporadas</h1>
          <p className={s.subtitle}>Agrupe os campeonatos da organização por período.</p>
        </div>
        {!isFormOpen && (
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Nova temporada
          </Button>
        )}
      </header>

      {isFormOpen && (
        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.formGrid}>
            <Field
              label="Rótulo"
              inputProps={{ value: label, onChange: (e) => setLabel(e.target.value), placeholder: '2026/27' }}
            />
            <Field label="Início" id="season-start">
              <DateTimeField id="season-start" type="date" value={startDate} onChange={setStartDate} />
            </Field>
            <Field label="Fim" id="season-end">
              <DateTimeField id="season-end" type="date" value={endDate} onChange={setEndDate} />
            </Field>
          </div>
          {formError && <p className={s.formError} role="alert">{formError}</p>}
          <div className={s.formActions}>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={createSeason.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      )}

      <div className={s.body}>
        {isError ? (
          <ErrorState title="Não foi possível carregar as temporadas." onRetry={refetch} />
        ) : isPending ? (
          <div className={s.skeletons}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={40} />
            ))}
          </div>
        ) : seasons && seasons.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Rótulo</TableHeaderCell>
                <TableHeaderCell>Período</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {seasons.map((season) => (
                <TableRow key={season.id}>
                  <TableCell>{season.label}</TableCell>
                  <TableCell>{formatDate(season.startDate)} – {formatDate(season.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={SEASON_STATUS[season.status].variant}>{SEASON_STATUS[season.status].label}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhuma temporada cadastrada."
            description="Crie a primeira temporada para organizar os campeonatos."
            icon={<CalendarRange size={20} strokeWidth={1.6} />}
          />
        )}
      </div>
    </div>
  )
}
