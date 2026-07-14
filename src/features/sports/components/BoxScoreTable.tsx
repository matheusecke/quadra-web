import { memo } from 'react'
import { NumberField } from '../../../components/ui/NumberField/NumberField'
import type { PlayerStatInput } from '../statistics'
import { validatePlayerStatLine } from '../statistics'
import s from './BoxScoreTable.module.css'

export interface BoxScoreRosterEntry {
  tournamentRosterId: string
  name: string
  number: number
}

export interface BoxScoreTableProps {
  roster: BoxScoreRosterEntry[]
  lines: Record<string, PlayerStatInput>
  onStatChange: (tournamentRosterId: string, field: keyof PlayerStatInput, value: number) => void
}

const STAT_COLUMNS: { field: keyof PlayerStatInput; label: string }[] = [
  { field: 'min', label: 'MIN' },
  { field: 'pts', label: 'PTS' },
  { field: 'fgm', label: 'FGM' },
  { field: 'fga', label: 'FGA' },
  { field: 'tpm', label: '3PM' },
  { field: 'tpa', label: '3PA' },
  { field: 'ftm', label: 'FTM' },
  { field: 'fta', label: 'FTA' },
  { field: 'reb', label: 'REB' },
  { field: 'ast', label: 'AST' },
  { field: 'stl', label: 'STL' },
  { field: 'blk', label: 'BLK' },
  { field: 'to', label: 'TOV' },
  { field: 'pf', label: 'PF' },
]

const emptyLine = (): PlayerStatInput => ({
  pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
  reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, min: 0,
})

export const BoxScoreTable = memo(function BoxScoreTable({ roster, lines, onStatChange }: BoxScoreTableProps) {
  const columnTotal = (field: keyof PlayerStatInput) =>
    roster.reduce((sum, entry) => sum + (lines[entry.tournamentRosterId]?.[field] ?? 0), 0)

  return (
    <div className={s.scroll}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.playerCol}>#</th>
            <th className={s.playerCol}>Atleta</th>
            {STAT_COLUMNS.map((column) => (
              <th key={column.field} className={s.statHead}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roster.map((entry) => {
            const line = lines[entry.tournamentRosterId] ?? emptyLine()
            const errors = validatePlayerStatLine(line)
            return (
              <tr key={entry.tournamentRosterId}>
                <td className={`${s.cell} ${s.mono}`}>{entry.number}</td>
                <td className={s.cell}>
                  <span className={s.name}>{entry.name}</span>
                  {errors.length > 0 && (
                    <ul className={s.errors}>
                      {errors.map((error) => (
                        <li key={`${error.field}-${error.message}`} className={s.errorItem} role="alert">{error.message}</li>
                      ))}
                    </ul>
                  )}
                </td>
                {STAT_COLUMNS.map((column) => (
                  <td key={column.field} className={s.cell}>
                    <NumberField
                      dense
                      aria-label={`${entry.name} — ${column.label}`}
                      controlLabel={column.label}
                      value={line[column.field]}
                      onValueChange={(next) => onStatChange(entry.tournamentRosterId, column.field, next === '' ? 0 : next)}
                      min={0}
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className={s.cell} />
            <td className={`${s.cell} ${s.totalLabel}`}>Totais</td>
            {STAT_COLUMNS.map((column) => (
              <td key={column.field} className={`${s.cell} ${s.mono} ${s.totalValue}`}>{columnTotal(column.field)}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
})
