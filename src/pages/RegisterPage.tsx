import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Field, Input, PasswordInput } from '../components/ui'
import s from './RegisterPage.module.css'

type RegisterErrors = {
  email?: string
  name?: string
  password?: string
  birthDate?: string
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
}): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!values.email.trim()) errors.email = 'Informe seu email.'
  if (!values.name.trim()) errors.name = 'Informe seu nome.'
  if (!values.password) {
    errors.password = 'Informe sua senha.'
  } else {
    const missingReqs =
      values.password.length < 8 ||
      !numberPattern.test(values.password) ||
      !specialPattern.test(values.password)
    if (missingReqs) {
      errors.password = 'A senha deve ter no mínimo 8 caracteres, 1 número e 1 caractere especial.'
    }
  }

  if (!values.birthDate) {
    errors.birthDate = 'Informe sua data de nascimento.'
  } else if (!toBackendBirthDate(values.birthDate)) {
    errors.birthDate = 'Use uma data valida no formato dd/mm/aaaa.'
  }

  return errors
}

function formatHeightDisplay(digits: string): string {
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  return `${padded[0]},${padded.slice(1)}m`
}

interface HeightInputProps {
  id: string
  digits: string
  onDigitsChange: (digits: string) => void
  error?: boolean
}

function HeightInput({ id, digits, onDigitsChange, error }: HeightInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      if (digits.length < 3) onDigitsChange(digits + e.key)
    } else if (e.key === 'Backspace') {
      onDigitsChange(digits.slice(0, -1))
    } else if (!['Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleIncrement = () => {
    if (!digits) { onDigitsChange('1'); return }
    const val = parseInt(digits, 10)
    if (val < 999) onDigitsChange(String(val + 1))
  }

  const handleDecrement = () => {
    if (!digits || digits === '1') { onDigitsChange(''); return }
    onDigitsChange(String(parseInt(digits, 10) - 1))
  }

  return (
    <div className={s.heightWrapper}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={formatHeightDisplay(digits)}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        placeholder="0,00m"
        error={error}
        fullWidth
        className={s.heightInput}
      />
      <div className={s.heightArrows}>
        <button
          type="button"
          className={s.heightArrow}
          onClick={handleIncrement}
          aria-label="Aumentar altura"
          tabIndex={-1}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className={s.heightArrow}
          onClick={handleDecrement}
          aria-label="Diminuir altura"
          tabIndex={-1}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const { status, register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [heightDigits, setHeightDigits] = useState('')
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

    const nextErrors = validateRegisterForm({ email, name, password, birthDate })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const parsedHeight = heightDigits ? parseInt(heightDigits, 10) : undefined
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
              hint={!errors.password ? 'Mínimo 8 caracteres, 1 número e 1 caractere especial.' : undefined}
            >
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                error={!!errors.password}
              />
            </Field>

            <div className={s.fieldRow}>
              <Field
                label="Data de nascimento"
                id="birthDate"
                required
                error={errors.birthDate}
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

              <Field label="Altura (opcional)" id="height">
                <HeightInput
                  id="height"
                  digits={heightDigits}
                  onDigitsChange={setHeightDigits}
                />
              </Field>
            </div>

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
