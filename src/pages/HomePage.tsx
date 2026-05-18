import { useAuth } from '../hooks/useAuth'
import s from './HomePage.module.css'

export function HomePage() {
  const { user, organizations } = useAuth()
  const activeOrg = organizations.find((o) => o.organizationId === user?.organizationId)

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>
          {activeOrg?.organizationName ?? '—'} · {user?.role ?? '—'}
        </p>
        <h1 className={s.title}>Início</h1>
      </header>

      <p className={s.welcome}>
        Bem-vindo à <strong>{activeOrg?.organizationName ?? '—'}</strong>, {user?.name ?? '—'}.
      </p>
    </div>
  )
}
