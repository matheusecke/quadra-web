import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { FormEvent } from 'react'

export function LoginPage() {
  const { status, login, chooseOrg } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // If the user already has a valid session, skip the login screen
  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/home', { replace: true })
    }
  }, [status, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { organizations } = await login(email, password)

      if (organizations.length === 0) {
        navigate('/home')
      } else if (organizations.length === 1) {
        await chooseOrg(organizations[0].organizationId)
        navigate('/home')
      } else {
        navigate('/select-org')
      }
    } catch {
      setError('Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="public-page">
      <section className="public-panel" aria-labelledby="login-title">
        <div className="public-panel__body">
          <div className="brand-mark" aria-hidden="true">
            B
          </div>
          <h1 className="page-title" id="login-title">
            Login
          </h1>
          <p className="page-description">Acesse sua conta para continuar.</p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="alert alert--danger" role="alert">{error}</p>}
            <button className="button button--primary button--full" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Login'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
