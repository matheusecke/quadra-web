import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import api from '../services/api'
import type { ApiResponse, MePayload } from '../types/api'

async function fetchMe(): Promise<MePayload> {
  const { data } = await api.get<ApiResponse<MePayload>>('/auth/me')
  return data.data
}

export function HomePage() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  })

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <div>
            <p className="page-kicker">Área autenticada</p>
            <h1 className="page-title">Home</h1>
            <p className="page-description">
              Informações atuais da sua sessão e vínculo organizacional.
            </p>
          </div>

          {user && (
            <div className="user-chip" aria-label={`Usuário autenticado: ${user.name}`}>
              <span className="user-chip__avatar" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span>{user.name}</span>
            </div>
          )}
        </header>

        <section className="content-grid">
          {isLoading && (
            <div className="card">
              <div className="card__body">
                <p className="alert alert--info">Carregando dados do usuário...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="card">
              <div className="card__body">
                <p className="alert alert--danger" role="alert">
                  Erro ao carregar dados do usuário.
                </p>
              </div>
            </div>
          )}

          {user && (
            <article className="card" aria-labelledby="profile-title">
              <div className="card__header">
                <h2 className="card__title" id="profile-title">Resumo do perfil</h2>
                <p className="card__description">
                  Confira seus dados de acesso e vínculo com a organização.
                </p>
              </div>
              <div className="card__body">
                <dl className="profile-grid">
                  <div className="profile-item">
                    <dt className="profile-item__label">Nome</dt>
                    <dd className="profile-item__value">{user.name}</dd>
                  </div>

                  <div className="profile-item">
                    <dt className="profile-item__label">Email</dt>
                    <dd className="profile-item__value">{user.email}</dd>
                  </div>

                  <div className="profile-item">
                    <dt className="profile-item__label">Organização</dt>
                    <dd className="profile-item__value">
                      {user.organizationId === null ? 'Sem organização' : user.organizationId}
                    </dd>
                  </div>

                  <div className="profile-item">
                    <dt className="profile-item__label">Papel</dt>
                    <dd className="profile-item__value">{user.role ?? 'Não definido'}</dd>
                  </div>

                  <div className="profile-item">
                    <dt className="profile-item__label">Admin do sistema</dt>
                    <dd className="profile-item__value">
                      <span
                        className={
                          user.isSystemAdmin ? 'status-badge' : 'status-badge status-badge--neutral'
                        }
                      >
                        {user.isSystemAdmin ? 'Sim' : 'Não'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          )}
        </section>
      </main>
    </div>
  )
}
