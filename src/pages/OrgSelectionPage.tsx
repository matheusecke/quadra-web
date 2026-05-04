import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function OrgSelectionPage() {
  const { organizations, chooseOrg } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSelect = async (organizationId: number) => {
    setLoading(true)
    try {
      await chooseOrg(organizationId)
      navigate('/home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="public-page">
      <section className="public-panel public-panel--wide" aria-labelledby="org-title">
        <div className="public-panel__body">
          <p className="page-kicker">Organização</p>
          <h1 className="page-title" id="org-title">Selecione a organização</h1>
          <p className="page-description">Escolha a organização que deseja acessar nesta sessão.</p>

          {organizations.length === 0 ? (
            <p className="alert alert--info">Nenhuma organização disponível para seleção.</p>
          ) : (
            <ul className="org-list">
              {organizations.map((org) => (
                <li key={org.organizationId}>
                  <button
                    className="button org-card"
                    onClick={() => handleSelect(org.organizationId)}
                    disabled={loading}
                    type="button"
                  >
                    <span className="org-card__content">
                      <span className="org-card__name">{org.organizationName}</span>
                      <span className="org-card__meta">
                        {org.organizationSlug} - {org.role}
                      </span>
                    </span>
                    <span className="org-card__arrow" aria-hidden="true">&gt;</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
