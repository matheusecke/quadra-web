import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../Input'
import type { InputProps } from '../Input'
import s from './PasswordInput.module.css'

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  id: string
}

export function PasswordInput({ id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={s.wrapper}>
      <Input id={id} type={visible ? 'text' : 'password'} fullWidth className={s.input} {...props} />
      <button
        type="button"
        className={s.toggle}
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
      </button>
    </div>
  )
}
