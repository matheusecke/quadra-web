import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Field } from '../components/ui'
import s from './RegisterPage.module.css'

type RegisterErrors = {
  email?: string
  name?: string
  password?: string
  passwordReqs?: string[]
  birthDate?: string
  height?: string
}

const brDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
const numberPattern = /\d/
const specialPattern = /[^A-Za-z0-9]/

function formatBirthDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function toBackendBirthDate(value: string): string | null {
  const match = brDatePattern.exec(value)
  if (!match) return null

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const isValid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)

  if (!isValid) return null

  return `${year}-${month}-${day}`
}

function validateRegisterForm(values: {
  email: string
  name: string
  password: string
  birthDate: string
  height: string
}): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!values.email.trim()) errors.email = 'Informe seu email.'
  if (!values.name.trim()) errors.name = 'Informe seu nome.'
  if (!values.password) {
    errors.password = 'Informe sua senha.'
  } else {
    const reqs: string[] = []
    if (values.password.length < 8) reqs.push('A senha deve ter pelo menos 8 caracteres.')
    if (!numberPattern.test(values.password)) reqs.push('A senha deve ter pelo menos 1 numero.')
    if (!specialPattern.test(values.password)) reqs.push('A senha deve ter pelo menos 1 caractere especial.')
    if (reqs.length > 0) errors.passwordReqs = reqs
  }

  if (!values.birthDate) {
    errors.birthDate = 'Informe sua data de nascimento.'
  } else if (!toBackendBirthDate(values.birthDate)) {
    errors.birthDate = 'Use uma data valida no formato dd/mm/aaaa.'
  }

  if (values.height) {
    const height = Number(values.height)
    if (!Number.isInteger(height) || height <= 0) {
      errors.height = 'Informe a altura como um numero inteiro em centimetros.'
    }
  }

  return errors
}

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
        <rect x="30" y="30" width="420" height="840" />
        <line x1="30" y1="450" x2="450" y2="450" />
        <circle cx="240" cy="450" r="62" />
        <circle cx="240" cy="450" r="18" />
        <rect x="156" y="30" width="168" height="195" />
        <circle cx="240" cy="225" r="62" />
        <circle cx="240" cy="80" r="10" />
        <path d="M 214 30 A 26 26 0 0 0 266 30" />
        <g className={s.threePointLine}>
          <line x1="52" y1="30" x2="52" y2="214" />
          <line x1="428" y1="30" x2="428" y2="214" />
          <path d="M 52 214 C 82 390 398 390 428 214" />
        </g>
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

export function RegisterPage() {
  const { status, register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [height, setHeight] = useState('')
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/select-org', { replace: true })
    }
  }, [status, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const nextErrors = validateRegisterForm({ email, name, password, birthDate, height })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const parsedHeight = height ? Number(height) : undefined
      const backendBirthDate = toBackendBirthDate(birthDate)
      if (!backendBirthDate) return

      const { organizations } = await register({
        email: email.trim(),
        name: name.trim(),
        password,
        birthDate: backendBirthDate,
        ...(parsedHeight !== undefined ? { height: parsedHeight } : {}),
      })

      if (organizations.length === 0) {
        navigate('/no-org')
      } else {
        navigate('/select-org')
      }
    } catch {
      setFormError('Nao foi possivel criar sua conta. Confira os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={s.page}>
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

      <div className={s.formPanel}>
        <div className={s.formInner}>
          <h1 className={s.heading}>Criar conta</h1>
          <p className={s.sub}>Preencha seus dados para começar</p>

          <form className={s.form} onSubmit={handleSubmit} noValidate>
            <Field
              label="Email"
              id="email"
              required
              error={errors.email}
              inputProps={{
                id: 'email',
                type: 'email',
                value: email,
                onChange: (e) => setEmail(e.target.value),
                autoComplete: 'email',
                placeholder: 'nome@empresa.com',
              }}
            />

            <Field
              label="Nome"
              id="name"
              required
              error={errors.name}
              inputProps={{
                id: 'name',
                type: 'text',
                value: name,
                onChange: (e) => setName(e.target.value),
                autoComplete: 'name',
                placeholder: 'Nome completo',
              }}
            />

            <Field
              label="Senha"
              id="password"
              required
              error={errors.password}
              hint={!errors.password && !errors.passwordReqs ? 'Minimo 8 caracteres, 1 numero e 1 caractere especial.' : undefined}
              inputProps={{
                id: 'password',
                type: 'password',
                value: password,
                onChange: (e) => setPassword(e.target.value),
                autoComplete: 'new-password',
                placeholder: '••••••••',
              }}
            />
            {errors.passwordReqs?.map((req) => (
              <p key={req} className={s.error} role="alert">
                {req}
              </p>
            ))}

            <Field
              label="Data de nascimento"
              id="birthDate"
              required
              error={errors.birthDate}
              hint="Use o formato dd/mm/aaaa."
              inputProps={{
                id: 'birthDate',
                type: 'text',
                inputMode: 'numeric',
                value: birthDate,
                onChange: (e) => setBirthDate(formatBirthDateInput(e.target.value)),
                placeholder: '23/04/1998',
                maxLength: 10,
              }}
            />

            <Field
              label="Altura (opcional)"
              id="height"
              error={errors.height}
              hint="Em centimetros. Exemplo: 182."
              inputProps={{
                id: 'height',
                type: 'number',
                inputMode: 'numeric',
                min: 1,
                step: 1,
                value: height,
                onChange: (e) => setHeight(e.target.value),
                placeholder: '182',
              }}
            />

            {formError && (
              <p className={s.error} role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className={s.submitBtn} disabled={loading}>
              <span>{loading ? 'Criando conta...' : 'Criar conta'}</span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>

            <p className={s.authSwitch}>
              Ja tem conta? <Link to="/login">Entrar</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
