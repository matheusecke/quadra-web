import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function NoOrgPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <main className="public-page">
      <section className="public-panel" aria-labelledby="no-org-title">
        <div className="public-panel__body empty-state">
          <div className="brand-mark" aria-hidden="true">
            !
          </div>
          <p className="page-kicker">Acesso pendente</p>
          <h1 className="page-title" id="no-org-title">
            Sem organização
          </h1>
          <p className="page-description">
            Seu usuário não está vinculado a nenhuma organização. Entre em contato com um
            administrador.
          </p>
          <div className="empty-state__actions">
            <button
              className="button button--secondary button--full"
              onClick={handleLogout}
              type="button"
            >
              Sair
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
