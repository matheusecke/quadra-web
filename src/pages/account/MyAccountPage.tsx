import { PersonalDataSection } from './PersonalDataSection'
import s from './account.module.css'

export function MyAccountPage() {
  return (
    <div className={s.page}>
      <header>
        <p className={s.kicker}>Conta</p>
        <h1 className={s.title}>Minha conta</h1>
        <p className={s.subtitle}>Seus dados pessoais e a segurança do seu acesso.</p>
      </header>

      <PersonalDataSection />
    </div>
  )
}
