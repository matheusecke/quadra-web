import s from './BootstrapSkeleton.module.css'

export function BootstrapSkeleton() {
  return (
    <div className={s.page} aria-live="polite" aria-busy="true" aria-label="Carregando sessão">
      <div className={s.card}>
        <div className={`${s.line} ${s['line--sm']}`} />
        <div className={`${s.line} ${s['line--wide']}`} />
        <div className={`${s.line} ${s['line--mid']}`} />
      </div>
    </div>
  )
}
