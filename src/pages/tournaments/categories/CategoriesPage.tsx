import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Tags } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Field } from '../../../components/ui/Field/Field'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/ui/Table/Table'
import { useCategoriesQuery, useCreateCategory } from '../../../features/sports/queries'
import s from './CategoriesPage.module.css'

export function CategoriesPage() {
  const { data: categories, isPending, isError, refetch } = useCategoriesQuery()
  const createCategory = useCreateCategory()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [formError, setFormError] = useState('')

  const sorted = useMemo(
    () => [...(categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories],
  )

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
    await createCategory.mutateAsync({ name: name.trim(), sortOrder: sortOrder ? Number(sortOrder) : undefined })
    closeForm()
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>Esportivo</p>
          <h1 className={s.title}>Categorias</h1>
          <p className={s.subtitle}>Divisões usadas para classificar os campeonatos (Sub-19, Adulto…).</p>
        </div>
        {!isFormOpen && (
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Nova categoria
          </Button>
        )}
      </header>

      {isFormOpen && (
        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.formGrid}>
            <Field
              label="Nome"
              inputProps={{ value: name, onChange: (e) => setName(e.target.value), placeholder: 'Veterano' }}
            />
            <Field
              label="Ordem"
              inputProps={{ type: 'number', min: 0, value: sortOrder, onChange: (e) => setSortOrder(e.target.value) }}
            />
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
        ) : sorted.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Ordem</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhuma categoria cadastrada."
            description="Crie categorias para classificar os campeonatos da organização."
            icon={<Tags size={20} strokeWidth={1.6} />}
          />
        )}
      </div>
    </div>
  )
}
