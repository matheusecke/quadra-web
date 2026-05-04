import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Sidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar__top">
        <div className="sidebar__brand">
          <div className="sidebar__logo" aria-hidden="true">
            B
          </div>
          <div>
            <p className="sidebar__title">TCC Web</p>
            <p className="sidebar__subtitle">Organizações</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <button
            className="button button--ghost sidebar__button"
            onClick={() => navigate('/home')}
            type="button"
            aria-current="page"
          >
            Home
          </button>
        </nav>
      </div>

      <button className="button button--ghost sidebar__logout" onClick={handleLogout} type="button">
        Sair
      </button>
    </aside>
  )
}
