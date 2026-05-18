import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Building2, Shield } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import * as adminApi from '../../services/adminApi'
import s from './AdminDashboardPage.module.css'

type ModuleCardProps = {
  icon: React.ReactNode
  label: string
  sublabel: string
  to: string
}

function ModuleCard({ icon, label, sublabel, to }: ModuleCardProps) {
  const navigate = useNavigate()
  return (
    <button type="button" className={s.moduleCard} onClick={() => navigate(to)}>
      <span className={s.moduleIcon}>{icon}</span>
      <p className={s.moduleLabel}>{label}</p>
      <p className={s.moduleSublabel}>{sublabel}</p>
    </button>
  )
}

export function AdminDashboardPage() {
  const { data: usersPage, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-stats-users'],
    queryFn: () => adminApi.listUsers({ page: 1, limit: 1 }),
  })
  const { data: orgsPage, isLoading: loadingOrgs } = useQuery({
    queryKey: ['admin-stats-orgs'],
    queryFn: () => adminApi.listOrgs({ page: 1, limit: 1 }),
  })
  const { data: teamsPage, isLoading: loadingTeams } = useQuery({
    queryKey: ['admin-stats-teams'],
    queryFn: () => adminApi.listTeams({ page: 1, limit: 1 }),
  })

  const total = (loading: boolean, data?: { meta: { totalItems: number } }) =>
    loading ? <Skeleton width={48} height={28} /> : (data?.meta.totalItems ?? '—')

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Administração do sistema</p>
        <h1 className={s.title}>Visão geral</h1>
      </header>

      <section className={s.statsRow} aria-label="Totais">
        <StatCard label="Usuários" value={total(loadingUsers, usersPage)} />
        <StatCard label="Organizações" value={total(loadingOrgs, orgsPage)} />
        <StatCard label="Equipes" value={total(loadingTeams, teamsPage)} />
      </section>

      <section className={s.modulesRow} aria-label="Módulos">
        <ModuleCard
          icon={<Users size={20} strokeWidth={1.5} />}
          label="Usuários"
          sublabel="Gerenciar usuários globais"
          to="/admin/users"
        />
        <ModuleCard
          icon={<Building2 size={20} strokeWidth={1.5} />}
          label="Organizações"
          sublabel="Gerenciar organizações"
          to="/admin/organizations"
        />
        <ModuleCard
          icon={<Shield size={20} strokeWidth={1.5} />}
          label="Equipes"
          sublabel="Gerenciar equipes"
          to="/admin/teams"
        />
      </section>
    </div>
  )
}
