import { useState } from 'react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { Field } from '../../../components/ui/Field/Field'
import type { StandingRow, StandingsState } from '../types'
import s from './TiebreakPanel.module.css'

export interface TiebreakPanelProps {
  /** Exactly the rows of one tie block — they share a tieBlockKey. */
  rows: StandingRow[]
  standingsState: StandingsState
  isResolved: boolean
  onSave: (entries: { tournamentTeamId: number; order: number }[]) => Promise<void>
  onClear: () => Promise<void>
  onCancel: () => void
  errorMessage?: string
}

export function TiebreakPanel({ rows, standingsState, isResolved, onSave, onClear, onCancel, errorMessage }: TiebreakPanelProps) {
  const [orders, setOrders] = useState<Record<number, number>>(
    Object.fromEntries(rows.map((row, i) => [row.tournamentTeamId, i + 1])),
  )
  const [busy, setBusy] = useState(false)

  const values = Object.values(orders).sort((a, b) => a - b)
  const isPermutation = values.length === rows.length && values.every((value, i) => value === i + 1)

  const handleSave = async () => {
    setBusy(true)
    try {
      await onSave(rows.map((row) => ({ tournamentTeamId: row.tournamentTeamId, order: orders[row.tournamentTeamId] })))
    } catch {
      // the caller surfaces the failure via errorMessage; keep the panel open to retry
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    setBusy(true)
    try {
      await onClear()
    } catch {
      // the caller surfaces the failure via errorMessage; keep the panel open to retry
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.panel}>
      <p className={s.explain}>
        Confronto direto, saldo e pontos marcados se esgotaram entre estas equipes (FIBA D.1.3, critério 6).
        Realize o sorteio presencialmente e transcreva o resultado abaixo — o sistema registra o sorteio, não o realiza.
      </p>

      {standingsState === 'PARTIAL' && (
        <Badge variant="warning">
          A fase não terminou. Este empate provavelmente se desfaz no próximo resultado, e o sorteio deixará de ter efeito.
        </Badge>
      )}

      <ul className={s.list}>
        {rows.map((row) => (
          <li key={row.tournamentTeamId} className={s.row}>
            <span className={s.teamName}>{row.teamName}</span>
            <Field label={`Posição de ${row.teamName}`} id={`tiebreak-${row.tournamentTeamId}`}>
              <div className={s.controlWrap}>
                <Combobox
                  id={`tiebreak-${row.tournamentTeamId}`}
                  options={rows.map((_, i) => ({ value: String(i + 1), label: `${i + 1}º` }))}
                  value={String(orders[row.tournamentTeamId])}
                  onChange={(next) => setOrders((current) => ({ ...current, [row.tournamentTeamId]: Number(next) }))}
                />
              </div>
            </Field>
          </li>
        ))}
      </ul>

      {!isPermutation && <p className={s.hint}>Cada posição pode ser usada uma única vez.</p>}
      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}

      <div className={s.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        {isResolved && (
          <Button type="button" variant="ghost" onClick={handleClear} loading={busy}>Desfazer sorteio</Button>
        )}
        <Button type="button" variant="primary" onClick={handleSave} loading={busy} disabled={!isPermutation}>
          Registrar sorteio
        </Button>
      </div>
    </div>
  )
}
