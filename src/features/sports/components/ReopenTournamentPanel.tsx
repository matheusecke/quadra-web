import { AlertTriangle } from 'lucide-react'
import { Button } from '../../../components/ui'
import s from './ReopenTournamentPanel.module.css'

export function ReopenTournamentPanel({ championName, onConfirm, onCancel, loading, errorMessage }: { championName: string | null; onConfirm: () => void; onCancel: () => void; loading?: boolean; errorMessage?: string }) {
  return (
    <div className={s.panel}>
      <p className={s.risk}>
        <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
        <span>
          O campeonato volta para <strong>Em andamento</strong>
          {championName ? <> e o campeão <strong>{championName}</strong> será removido</> : ' e o campeão será removido'}.
          {' '}Partidas, resultados, equipes e chaveamento são mantidos.
        </span>
      </p>
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
      <div className={s.actions}>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Confirmar reabertura</Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
      </div>
    </div>
  )
}
