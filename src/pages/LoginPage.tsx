import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Field, PasswordInput } from '../components/ui'
import s from './LoginPage.module.css'

function CourtSvg() {
  const sw = 2

  return (
    <svg
      className={s.courtSvg}
      viewBox="0 0 480 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className={s.courtLine} strokeWidth={sw} fill="none">
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
        {/* 3pt line */}
        <g className={s.threePointLine}>
          <line x1="52" y1="30" x2="52" y2="214" />
          <line x1="428" y1="30" x2="428" y2="214" />
          <path d="M 52 214 C 82 390 398 390 428 214" />
        </g>

        {/* ── Bottom half (basket at y=820) ── */}
        <rect x="156" y="675" width="168" height="195" />
        <circle cx="240" cy="675" r="62" />
        <circle cx="240" cy="820" r="10" />
        <path d="M 214 870 A 26 26 0 0 1 266 870" />
        <g className={s.threePointLine}>
          <line x1="52" y1="870" x2="52" y2="686" />
          <line x1="428" y1="870" x2="428" y2="686" />
          <path d="M 52 686 C 82 510 398 510 428 686" />
        </g>
      </g>
    </svg>
  )
}

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/select-org', { replace: true })
    }
  }, [status, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { organizations } = await login(email, password)

      if (organizations.length === 0) {
        navigate('/no-org')
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
            <Field
              label="Email"
              id="email"
              required
              inputProps={{
                id: 'email',
                type: 'email',
                value: email,
                onChange: (e) => setEmail(e.target.value),
                autoComplete: 'email',
                placeholder: 'nome@empresa.com',
              }}
            />

            <Field label="Senha" id="password" required>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className={s.submitBtn} disabled={loading}>
              <span>{loading ? 'Entrando...' : 'Entrar'}</span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>

            <p className={s.authSwitch}>
              Nao tem conta? <Link to="/register">Criar conta</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
