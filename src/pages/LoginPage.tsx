import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import s from './LoginPage.module.css'

function CourtSvg() {
  const stroke = 'rgba(255,255,255,0.065)'
  const sw = 2

  return (
    <svg
      className={s.courtSvg}
      viewBox="0 0 480 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke={stroke} strokeWidth={sw} fill="none">
        {/* Court boundary */}
        <rect x="30" y="30" width="420" height="840" />

        {/* Half-court line */}
        <line x1="30" y1="450" x2="450" y2="450" />

        {/* Center circles */}
        <circle cx="240" cy="450" r="62" />
        <circle cx="240" cy="450" r="18" />

        {/* ── Top half (basket at y=80) ── */}
        {/* Lane / paint */}
        <rect x="156" y="30" width="168" height="195" />
        {/* Free throw circle */}
        <circle cx="240" cy="225" r="62" />
        {/* Basket */}
        <circle cx="240" cy="80" r="10" />
        {/* Restricted area arc */}
        <path d="M 214 30 A 26 26 0 0 0 266 30" />
        {/* 3pt corner lines */}
        <line x1="59" y1="30" x2="59" y2="110" />
        <line x1="421" y1="30" x2="421" y2="110" />
        {/* 3pt arc */}
        <path d="M 59 110 A 192 192 0 0 1 421 110" />

        {/* ── Bottom half (basket at y=820) ── */}
        <rect x="156" y="675" width="168" height="195" />
        <circle cx="240" cy="675" r="62" />
        <circle cx="240" cy="820" r="10" />
        <path d="M 214 870 A 26 26 0 0 1 266 870" />
        <line x1="59" y1="870" x2="59" y2="790" />
        <line x1="421" y1="870" x2="421" y2="790" />
        <path d="M 59 790 A 192 192 0 0 0 421 790" />
      </g>
    </svg>
  )
}

export function LoginPage() {
  const { status, login, chooseOrg } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    <main className={s.page}>
      {/* ── Left: court panel ── */}
      <div className={s.courtPanel} aria-hidden="true">
        <div className={s.courtInner}>
          <CourtSvg />
          <span className={s.brand}>Quadra</span>
          <div className={s.courtBottom}>
            <span className={s.tagline}>Gerencie sua competição</span>
            <div className={s.taglineLine} />
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className={s.formPanel}>
        <div className={s.formInner}>
          <h1 className={s.heading}>Bem-vindo de volta</h1>
          <p className={s.sub}>Acesse a sua conta</p>

          <form className={s.form} onSubmit={handleSubmit} noValidate>
            <div className={s.field}>
              <label htmlFor="email" className={s.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className={s.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className={s.field}>
              <label htmlFor="password" className={s.label}>
                Senha
              </label>
              <input
                id="password"
                type="password"
                className={s.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className={s.submitBtn} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
