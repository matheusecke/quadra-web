import { useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { Collapse } from '../../../components/ui/Collapse/Collapse'
import { STAT_TOGGLE_GROUPS, type StatField } from '../statistics'
import s from './StatColumnsConfig.module.css'

interface StatColumnsConfigProps {
  disabledColumns: StatField[]
  groupHasData: (fields: StatField[]) => boolean
  onToggle: (fields: StatField[], enabled: boolean) => void
}

export function StatColumnsConfig({ disabledColumns, groupHasData, onToggle }: StatColumnsConfigProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState<StatField[] | null>(null)
  const enabledCount = STAT_TOGGLE_GROUPS.flatMap((group) => group.fields)
    .filter((field) => !disabledColumns.includes(field)).length
  const total = STAT_TOGGLE_GROUPS.flatMap((group) => group.fields).length
  const confirmingLabel = confirming
    ? STAT_TOGGLE_GROUPS.find((group) => group.fields === confirming)?.label
    : null

  const requestToggle = (fields: StatField[], enabled: boolean) => {
    if (!enabled && groupHasData(fields)) {
      setConfirming(fields)
      return
    }
    onToggle(fields, enabled)
  }

  return (
    <div className={s.root}>
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls="stat-columns-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Configurar estatísticas <span className={s.count}>· {enabledCount}/{total}</span>
      </Button>
      <Collapse open={open} id="stat-columns-panel" role="group" aria-label="Estatísticas acompanhadas nesta partida">
        <div className={s.panel}>
          {STAT_TOGGLE_GROUPS.map((group) => {
            const enabled = !group.fields.every((field) => disabledColumns.includes(field))
            return (
              <div key={group.id} className={s.row}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={group.label}
                  className={`${s.switch} ${enabled ? s.on : ''}`}
                  onClick={() => requestToggle(group.fields, !enabled)}
                />
                <span className={s.name}>{group.label}</span>
                {!enabled && <span className={s.na}>N/A</span>}
              </div>
            )
          })}
          {confirming && (
            <div className={s.confirm} role="alertdialog" aria-label="Descartar valores">
              <p>Os valores de {confirmingLabel} serão descartados para todos os atletas e a estatística ficará como não acompanhada (N/A). Reabilitar reinicia em 0.</p>
              <div className={s.confirmActions}>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={() => { onToggle(confirming, false); setConfirming(null) }}>Descartar e desabilitar</Button>
              </div>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  )
}
