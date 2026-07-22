import { memo } from 'react'
import { NumberField } from '../../../components/ui/NumberField/NumberField'
import type { PlayerStatInput, StatField } from '../statistics'
import { sumNullable, validatePlayerStatLine } from '../statistics'
import { formatMinutesSeconds } from '../sportsUtils'
import s from './BoxScoreTable.module.css'

export interface BoxScoreRosterEntry {
  tournamentRosterId: number
  name: string
  number: number
}

export interface BoxScoreTableProps {
  roster: BoxScoreRosterEntry[]
  lines: Record<number, PlayerStatInput>
  disabledColumns: StatField[]
  onStatChange: (tournamentRosterId: number, field: keyof PlayerStatInput, value: number | null) => void
}

const STAT_COLUMNS: { field: StatField; label: string }[] = [
  { field: 'minutesSeconds', label: 'MIN' },
  { field: 'pts', label: 'PTS' },
  { field: 'fgm', label: 'FGM' },
  { field: 'fga', label: 'FGA' },
  { field: 'threeFgm', label: '3PM' },
  { field: 'threeFga', label: '3PA' },
  { field: 'ftm', label: 'FTM' },
  { field: 'fta', label: 'FTA' },
  { field: 'reb', label: 'REB' },
  { field: 'ast', label: 'AST' },
  { field: 'stl', label: 'STL' },
  { field: 'blk', label: 'BLK' },
  { field: 'tov', label: 'TOV' },
  { field: 'pf', label: 'PF' },
]

export const BoxScoreTable = memo(function BoxScoreTable({ roster, lines, disabledColumns, onStatChange }: BoxScoreTableProps) {
  const columnTotal = (field: StatField) =>
    sumNullable(roster.map((entry) => lines[entry.tournamentRosterId]?.[field] ?? null))

  return (
    <div className={s.scroll}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.playerCol}>#</th>
            <th className={s.playerCol}>Atleta</th>
            {STAT_COLUMNS.map((column) => {
              const disabled = disabledColumns.includes(column.field)
              return (
                <th
                  key={column.field}
                  className={`${s.statHead} ${disabled ? s.headOff : ''}`}
                  aria-label={disabled ? `${column.label} — não acompanhada` : undefined}
                >
                  <span className={disabled ? s.lblOff : undefined}>{column.label}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {roster.map((entry) => {
            const line = lines[entry.tournamentRosterId]
            const errors = line ? validatePlayerStatLine(line) : []
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
                {STAT_COLUMNS.map((column) => {
                  const isPlayingTime = column.field === 'minutesSeconds'
                  const disabled = disabledColumns.includes(column.field)
                  const raw = line?.[column.field] ?? null
                  if (disabled) {
                    return <td key={column.field} className={`${s.cell} ${s.colOff}`}><span className={s.na}>N/A</span></td>
                  }
                  const value = raw === null ? '' : isPlayingTime ? raw / 60 : raw
                  return (
                    <td key={column.field} className={s.cell}>
                      <NumberField
                        dense
                        aria-label={`${entry.name} — ${column.label}`}
                        controlLabel={column.label}
                        value={value}
                        onValueChange={(next) => {
                          const nextValue = next === '' ? null : isPlayingTime ? next * 60 : next
                          onStatChange(entry.tournamentRosterId, column.field, nextValue)
                        }}
                        min={0}
                      />
                  </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className={s.cell} />
            <td className={`${s.cell} ${s.totalLabel}`}>Totais</td>
            {STAT_COLUMNS.map((column) => {
              const total = columnTotal(column.field)
              return (
                <td key={column.field} className={`${s.cell} ${s.mono} ${s.totalValue}`}>
                  {total === null ? 'N/A' : column.field === 'minutesSeconds' ? formatMinutesSeconds(total) : total}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
})
