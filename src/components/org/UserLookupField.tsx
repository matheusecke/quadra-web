import { useRef, useState } from 'react'
import { Button } from '../ui/Button/Button'
import { Field } from '../ui/Field/Field'
import { Input } from '../ui/Input/Input'
import { cn } from '../ui/cn'
import { apiErrorStatus } from '../../services/apiError'
import { lookupUserByEmail } from '../../services/orgApi'
import type { UserLookupResult } from '../../types/org'
import s from './UserLookupField.module.css'

type LookupState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; user: UserLookupResult }
  | { kind: 'empty' }
  | { kind: 'error' }

type Props = {
  value: UserLookupResult | null
  onChange: (user: UserLookupResult | null) => void
  disabled?: boolean
}

const EMAIL_FIELD_ID = 'user-lookup-email'

export function UserLookupField({ value, onChange, disabled = false }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<LookupState>({ kind: 'idle' })
  const requestRef = useRef(0)

  const handleEmailChange = (next: string) => {
    requestRef.current += 1
    setEmail(next)
    setState({ kind: 'idle' })
    // Editing the address always drops a previously confirmed selection (spec §6.3).
    if (value !== null) onChange(null)
  }

  const handleSearch = async () => {
    const trimmed = email.trim()
    if (trimmed === '') return

    const request = ++requestRef.current
    setState({ kind: 'loading' })
    try {
      const user = await lookupUserByEmail(trimmed)
      if (request === requestRef.current) setState({ kind: 'found', user })
    } catch (error) {
      if (request === requestRef.current) {
        setState(apiErrorStatus(error) === 404 ? { kind: 'empty' } : { kind: 'error' })
      }
    }
  }

  return (
    <div className={s.wrap}>
      <Field label="E-mail da pessoa" id={EMAIL_FIELD_ID}>
        <div className={s.row}>
          <Input
            id={EMAIL_FIELD_ID}
            type="email"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              void handleSearch()
            }}
            placeholder="pessoa@exemplo.com"
            disabled={disabled}
            autoComplete="off"
            fullWidth
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleSearch()}
            disabled={disabled}
            loading={state.kind === 'loading'}
          >
            Buscar
          </Button>
        </div>
      </Field>

      <div className={s.result} aria-live="polite">
        {state.kind === 'found' && (
          <button
            type="button"
            className={cn(s.candidate, value?.id === state.user.id && s.selected)}
            onClick={() => onChange(state.user)}
            aria-pressed={value?.id === state.user.id}
          >
            <span className={s.candidateName}>{state.user.name}</span>
            <span className={s.candidateEmail}>{state.user.email}</span>
          </button>
        )}
        {state.kind === 'empty' && <p className={s.empty}>Usuário ativo não encontrado</p>}
        {state.kind === 'error' && (
          <p className={s.error} role="alert">
            Não foi possível buscar o usuário. Tente novamente.
          </p>
        )}
      </div>
    </div>
  )
}
