import { useState } from 'react'
import {
  House,
  CalendarDays,
  Bell,
  Users,
  Shield,
  Mail,
  Trophy,
  Settings,
  Shirt,
  Swords,
  BarChart2,
  ArrowLeftRight,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './ui/Avatar/Avatar'
import { cn } from './ui/cn'
import s from './Sidebar.module.css'

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <NavLink to={to} className={({ isActive }) => cn(s.navItem, isActive && s.active)}>
      <span className={s.navIcon}>{icon}</span>
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const { user, organizations, logout } = useAuth()
  const [orgOpen, setOrgOpen] = useState(false)

  const role = user?.role ?? null
  const activeOrg = organizations.find((o) => o.organizationId === user?.organizationId) ?? null

  const isOrgAdmin = role === 'ORG_ADMIN'
  const isTeamRole = role === 'TEAM_ADMIN' || role === 'ATHLETE' || role === 'COACHING_STAFF'

  const handleLogout = async () => {
    setOrgOpen(false)
    await logout()
    navigate('/login')
  }

  const handleSwitchOrg = () => {
    setOrgOpen(false)
    navigate('/select-org')
  }

  return (
    <aside className={s.sidebar} aria-label="Navegação principal">
      <div className={s.brand} aria-label="Quadra">Quadra</div>

      <nav className={s.nav} aria-label="Menu principal">
        <span className={s.sectionLabel}>Principal</span>
        <NavItem to="/home" icon={<House size={15} strokeWidth={1.6} />} label="Início" />
        <NavItem to="/schedule" icon={<CalendarDays size={15} strokeWidth={1.6} />} label="Agenda" />
        <NavItem to="/notifications" icon={<Bell size={15} strokeWidth={1.6} />} label="Notificações" />

        {(isOrgAdmin || isTeamRole) && (
          <>
            <span className={s.sectionLabel}>Organização</span>
            <NavItem to="/users" icon={<Users size={15} strokeWidth={1.6} />} label="Usuários" />
            <NavItem to="/teams" icon={<Shield size={15} strokeWidth={1.6} />} label="Equipes" />
            <NavItem to="/invites" icon={<Mail size={15} strokeWidth={1.6} />} label="Convites" />
            <NavItem to="/championships" icon={<Trophy size={15} strokeWidth={1.6} />} label="Campeonatos" />
            <NavItem to="/roster" icon={<Shirt size={15} strokeWidth={1.6} />} label="Elenco" />
            <NavItem to="/matches" icon={<Swords size={15} strokeWidth={1.6} />} label="Partidas" />
            <NavItem to="/stats" icon={<BarChart2 size={15} strokeWidth={1.6} />} label="Estatísticas" />
            {isOrgAdmin && (
              <NavItem to="/settings" icon={<Settings size={15} strokeWidth={1.6} />} label="Configurações" />
            )}
          </>
        )}
      </nav>

      <div className={s.footer}>
        {orgOpen && activeOrg && (
          <div className={s.orgPanel} role="dialog" aria-label="Contexto da organização">
            <div className={s.orgHeader}>
              <p className={s.orgName}>{activeOrg.organizationName}</p>
              <p className={s.orgRole}>{user?.role}</p>
            </div>
            <button type="button" className={s.orgAction} onClick={handleSwitchOrg}>
              <ArrowLeftRight size={14} strokeWidth={1.6} />
              Trocar organização
            </button>
            <button type="button" className={cn(s.orgAction, s.danger)} onClick={handleLogout}>
              <LogOut size={14} strokeWidth={1.6} />
              Sair da conta
            </button>
          </div>
        )}

        <button
          type="button"
          className={s.userBtn}
          onClick={() => setOrgOpen((v) => !v)}
          aria-expanded={orgOpen}
          aria-controls="sidebar-org-panel"
        >
          <Avatar initials={user ? getInitials(user.name) : '?'} size="sm" />
          <div className={s.userInfo}>
            <p className={s.userName}>{user?.name ?? '—'}</p>
            <p className={s.userSub}>
              {activeOrg ? activeOrg.organizationName : 'Sem organização'}
            </p>
          </div>
          <span className={cn(s.chevron, orgOpen && s.open)}>
            <ChevronDown size={12} strokeWidth={1.5} />
          </span>
        </button>
      </div>
    </aside>
  )
}
