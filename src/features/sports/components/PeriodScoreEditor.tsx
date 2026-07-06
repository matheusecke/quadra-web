import { Button } from '../../../components/ui/Button/Button'
import { periodsSum } from '../statistics'
import { getPeriodLabel } from '../sportsUtils'
import type { PeriodScore } from '../types'
import s from './PeriodScoreEditor.module.css'

export interface PeriodScoreEditorProps {
  periods: PeriodScore[]
  onChange: (index: number, side: 'home' | 'away', value: number) => void
  onAddOvertime: () => void
  onRemoveOvertime: () => void
  homeName: string
  awayName: string
}

const periodAriaLabel = (period: PeriodScore) =>
  period.type === 'OVERTIME' ? `prorrogação ${period.overtimeNumber ?? 1}` : `${period.periodNumber}º período`

const hasOvertime = (periods: PeriodScore[]) => periods.some((p) => p.type === 'OVERTIME')

export function PeriodScoreEditor({ periods, onChange, onAddOvertime, onRemoveOvertime, homeName, awayName }: PeriodScoreEditorProps) {
  const totals = periodsSum(periods)

  const renderRow = (side: 'home' | 'away', teamName: string, total: number, testId: string) => (
    <tr>
      <th scope="row" className={s.rowLabel}>{teamName}</th>
      {periods.map((period, index) => {
        const value = side === 'home' ? period.homePoints : period.awayPoints
        return (
          <td key={period.periodNumber} className={s.cell}>
            <input
              key={`${period.periodNumber}-${side}`}
              className={s.input}
              type="number"
              min={0}
              aria-label={`${teamName} — ${periodAriaLabel(period)}`}
              defaultValue={value ?? ''}
              onChange={(e) => onChange(index, side, Number(e.target.value))}
            />
          </td>
        )
      })}
      <td className={s.total} data-testid={testId}>{total}</td>
    </tr>
  )

  return (
    <div className={s.wrap}>
      <div className={s.scroll}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.corner} />
              {periods.map((period) => (
                <th key={period.periodNumber} className={s.colLabel}>{getPeriodLabel(period)}</th>
              ))}
              <th className={s.colLabel}>Total</th>
            </tr>
          </thead>
          <tbody>
            {renderRow('home', homeName, totals.home, 'home-total')}
            {renderRow('away', awayName, totals.away, 'away-total')}
          </tbody>
        </table>
      </div>
      <div className={s.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={onAddOvertime}>
          + Adicionar prorrogação
        </Button>
        {hasOvertime(periods) && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemoveOvertime}>
            Remover prorrogação
          </Button>
        )}
      </div>
    </div>
  )
}
