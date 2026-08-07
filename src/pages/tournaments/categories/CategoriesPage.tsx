import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Search, Tags, X } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Field } from '../../../components/ui/Field/Field'
import { NumberField } from '../../../components/ui/NumberField/NumberField'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/ui/Table/Table'
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll'
import { useCategoriesInfiniteQuery, useCreateCategory } from '../../../features/sports/queries'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import { apiErrorCode } from '../../../services/apiError'
import type { EntityStatus } from '../../../types/admin'
import t from '../tournaments.module.css'
import s from './CategoriesPage.module.css'

const CREATE_ERRORS: Record<string, string> = {
  DUPLICATE_RECORD: 'Já existe uma categoria com esse nome (ou que gera o mesmo identificador).',
  VALIDATION_ERROR: 'Verifique os campos preenchidos.',
}

export function CategoriesPage() {
  const isOrgAdmin = useIsOrgAdmin()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<EntityStatus | ''>('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, refetch } =
    useCategoriesInfiniteQuery({ q: debouncedQ, status })
  const createCategory = useCreateCategory()

  const categories = data?.pages.flatMap((page) => page.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  const sentinelRef = useInfiniteScroll(loadMore, hasNextPage ?? false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState<number | ''>('')
  const [formError, setFormError] = useState('')

  const closeForm = () => {
    setIsFormOpen(false)
    setName('')
    setSortOrder('')
    setFormError('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setFormError('Informe o nome da categoria.')
      return
    }
    setFormError('')
    try {
      await createCategory.mutateAsync({ name: name.trim(), sortOrder: sortOrder === '' ? undefined : sortOrder })
      closeForm()
    } catch (error) {
      setFormError(CREATE_ERRORS[apiErrorCode(error) ?? ''] ?? 'Não foi possível salvar a categoria.')
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>Esportivo</p>
          <h1 className={s.title}>Categorias</h1>
          <p className={s.subtitle}>Divisões usadas para classificar os campeonatos (Sub-19, Adulto…).</p>
        </div>
        {isOrgAdmin && !isFormOpen && (
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Nova categoria
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
            placeholder="Buscar categoria por nome..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar categoria"
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
            options={[{ value: '', label: 'Status' }, { value: 'ACTIVE', label: 'Ativa' }, { value: 'INACTIVE', label: 'Inativa' }]}
            value={status || null}
            onChange={(value) => setStatus(value as EntityStatus | '')}
          />
        </div>
      </div>

      {isFormOpen && (
        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.formGrid}>
            <Field
              label="Nome"
              inputProps={{ value: name, onChange: (e) => setName(e.target.value), placeholder: 'Veterano' }}
            />
            <Field label="Ordem" id="category-sort-order">
              <NumberField id="category-sort-order" value={sortOrder} onValueChange={setSortOrder} min={0} />
            </Field>
          </div>
          {formError && <p className={s.formError} role="alert">{formError}</p>}
          <div className={s.formActions}>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={createCategory.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      )}

      <div className={s.body}>
        {isError ? (
          <ErrorState title="Não foi possível carregar as categorias." onRetry={refetch} />
        ) : isPending ? (
          <div className={s.skeletons}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={40} />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Ordem</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.sortOrder ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={category.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {category.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </Badge>
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
            <p className={t.counter}>{categories.length} de {total} carregados</p>
          </>
        ) : (
          <EmptyState
            title="Nenhuma categoria encontrada."
            description="Crie categorias para classificar os campeonatos da organização."
            icon={<Tags size={20} strokeWidth={1.6} />}
          />
        )}
      </div>
    </div>
  )
}
