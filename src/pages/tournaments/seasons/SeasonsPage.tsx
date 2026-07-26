import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarRange, Search, X } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { DateTimeField } from '../../../components/ui/DateTimeField/DateTimeField'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Field } from '../../../components/ui/Field/Field'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/ui/Table/Table'
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll'
import { useCreateSeason, useSeasonsInfiniteQuery } from '../../../features/sports/queries'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import { formatDate } from '../../../features/sports/sportsUtils'
import { apiErrorCode } from '../../../services/apiError'
import type { SeasonStatus } from '../../../features/sports/types'
import t from '../tournaments.module.css'
import s from './SeasonsPage.module.css'

const SEASON_STATUS: Record<SeasonStatus, { label: string; variant: 'success' | 'ghost' }> = {
  ACTIVE: { label: 'Ativa', variant: 'success' },
  ARCHIVED: { label: 'Arquivada', variant: 'ghost' },
}

const CREATE_ERRORS: Record<string, string> = {
  DUPLICATE_RECORD: 'Já existe uma temporada com esse rótulo.',
  INVALID_DATE_RANGE: 'A data de início deve ser anterior à data de fim.',
  INVALID_DATE: 'Data inválida.',
  VALIDATION_ERROR: 'Verifique os campos preenchidos.',
}

export function SeasonsPage() {
  const isOrgAdmin = useIsOrgAdmin()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<SeasonStatus | ''>('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, refetch } =
    useSeasonsInfiniteQuery({ q: debouncedQ, status })
  const createSeason = useCreateSeason()

  const seasons = data?.pages.flatMap((page) => page.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  const sentinelRef = useInfiniteScroll(loadMore, hasNextPage ?? false)

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
    setFormError('')
    try {
      await createSeason.mutateAsync({ label: label.trim(), startDate, endDate })
      closeForm()
    } catch (error) {
      setFormError(CREATE_ERRORS[apiErrorCode(error) ?? ''] ?? 'Não foi possível salvar a temporada.')
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>Esportivo</p>
          <h1 className={s.title}>Temporadas</h1>
          <p className={s.subtitle}>Agrupe os campeonatos da organização por período.</p>
        </div>
        {isOrgAdmin && !isFormOpen && (
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Nova temporada
          </Button>
        )}
      </header>

      <div className={t.toolbar}>
        <div className={t.searchWrap}>
          <span className={t.searchIcon} aria-hidden="true">
            <Search size={14} strokeWidth={1.7} />
          </span>
          <input
            className={t.searchInput}
            type="search"
            placeholder="Buscar temporada por rótulo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar temporada"
          />
          {q && (
            <button type="button" className={t.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">
              <X size={13} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className={t.filterControl}>
          <Combobox
            aria-label="Filtrar por status"
            options={[{ value: '', label: 'Status' }, { value: 'ACTIVE', label: 'Ativa' }, { value: 'ARCHIVED', label: 'Arquivada' }]}
            value={status || null}
            onChange={(value) => setStatus(value as SeasonStatus | '')}
          />
        </div>
      </div>

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
        ) : seasons.length > 0 ? (
          <>
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
                <TableRow>
                  <TableCell colSpan={3} style={{ padding: 0 }}>
                    <div ref={sentinelRef} style={{ height: 1 }} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {isFetchingNextPage && <Skeleton height={40} />}
            <p className={t.counter}>{seasons.length} de {total} carregados</p>
          </>
        ) : (
          <EmptyState
            title="Nenhuma temporada encontrada."
            description="Crie a primeira temporada para organizar os campeonatos."
            icon={<CalendarRange size={20} strokeWidth={1.6} />}
          />
        )}
      </div>
    </div>
  )
}
