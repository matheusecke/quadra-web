import { useState } from 'react'
import {
  House,
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  ArrowLeftRight,
  LogOut,
  ChevronDown,
  CalendarDays,
  Trophy,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './ui/Avatar/Avatar'
import { cn } from './ui/cn'
import s from './Sidebar.module.css'

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cn(s.navItem, isActive && s.active)}>
      <span className={s.navIcon}>{icon}</span>
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, organizations, logout } = useAuth()
  const [orgOpen, setOrgOpen] = useState(false)

  const isAdminMode = location.pathname.startsWith('/admin')
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
      <div className={s.brand} aria-label="Quadra">
        <img src="/favicon.svg" alt="" className={s.brandMark} />
        Quadra
      </div>

      <nav className={s.nav} aria-label="Menu principal">
        {isAdminMode ? (
          <>
            <span className={s.sectionLabel}>Administração</span>
            <NavItem to="/admin" end icon={<LayoutDashboard size={15} strokeWidth={1.6} />} label="Visão geral" />
            <NavItem to="/admin/users" icon={<Users size={15} strokeWidth={1.6} />} label="Usuários" />
            <NavItem to="/admin/organizations" icon={<Building2 size={15} strokeWidth={1.6} />} label="Organizações" />
            <NavItem to="/admin/teams" icon={<Shield size={15} strokeWidth={1.6} />} label="Equipes" />
          </>
        ) : (
          <>
            <span className={s.sectionLabel}>Principal</span>
            <NavItem to="/home" icon={<House size={15} strokeWidth={1.6} />} label="Início" />
            {(isOrgAdmin || isTeamRole) && (
              <>
                <span className={s.sectionLabel}>Organização</span>
                <NavItem to="/users" icon={<Users size={15} strokeWidth={1.6} />} label="Usuários" />
                <NavItem to="/teams" icon={<Shield size={15} strokeWidth={1.6} />} label="Equipes" />
                <span className={s.sectionLabel}>Esportivo</span>
                <NavItem to="/tournaments" icon={<Trophy size={15} strokeWidth={1.6} />} label="Campeonatos" />
                <NavItem to="/matches" icon={<CalendarDays size={15} strokeWidth={1.6} />} label="Partidas" />
              </>
            )}
          </>
        )}
      </nav>

      <div className={s.footer}>
        {orgOpen && (
          <div className={s.orgPanel} role="dialog" aria-label="Contexto da organização">
            <div className={s.orgHeader}>
              <p className={s.orgName}>
                {isAdminMode ? 'Administrador do sistema' : (activeOrg?.organizationName ?? '—')}
              </p>
              {!isAdminMode && <p className={s.orgRole}>{user?.role}</p>}
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
        >
          <Avatar initials={user ? getInitials(user.name) : '?'} size="sm" />
          <div className={s.userInfo}>
            <p className={s.userName}>
              {user?.name ?? '—'}
              {isAdminMode && <span className={s.userAdminTag}> · Admin</span>}
            </p>
            {!isAdminMode && (
              <p className={s.userSub}>
                {activeOrg ? activeOrg.organizationName : 'Sem organização'}
              </p>
            )}
          </div>
          <span className={cn(s.chevron, orgOpen && s.open)}>
            <ChevronDown size={12} strokeWidth={1.5} />
          </span>
        </button>
      </div>
    </aside>
  )
}
