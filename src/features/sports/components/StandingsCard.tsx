import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { StandingsTable } from '../../../pages/tournaments/parts/StandingsTable'
import type { StandingRow, StandingsEnvelope, Team } from '../types'
import { TiebreakPanel } from './TiebreakPanel'
import s from './StandingsCard.module.css'

export interface StandingsCardProps {
  envelope: StandingsEnvelope
  teams: Map<number, Team>
  isOrgAdmin: boolean
  onSetTiebreakOrder: (entries: { tournamentTeamId: number; order: number }[]) => Promise<void>
  onClearTiebreakOrder: (blockKey: string) => Promise<void>
  errorMessage?: string
  headerAction?: ReactNode
  /** Rendered in the same row action slot, only for rows with no tieBlockKey (e.g. "Remover do grupo"). */
  renderExtraRowAction?: (row: StandingRow) => ReactNode
}

export function StandingsCard({
  envelope, teams, isOrgAdmin, onSetTiebreakOrder, onClearTiebreakOrder, errorMessage, headerAction, renderExtraRowAction,
}: StandingsCardProps) {
  const [openBlockKey, setOpenBlockKey] = useState<string | null>(null)
  const { group, standingsState, pendingMatches, rows } = envelope

  const blockRows = (blockKey: string) => rows.filter((row) => row.tieBlockKey === blockKey)
  const isBlockResolved = (blockKey: string) => blockRows(blockKey).every((row) => !row.isTiedUnresolved)

  const renderRowAction = (row: StandingRow): ReactNode => {
    if (row.tieBlockKey) {
      if (!isOrgAdmin) return null
      const resolved = !row.isTiedUnresolved
      return (
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpenBlockKey(row.tieBlockKey)}>
          {resolved ? '✓ sorteio · refazer' : 'Registrar sorteio'}
        </Button>
      )
    }
    return renderExtraRowAction?.(row) ?? null
  }

  return (
    <section className={s.card}>
      <header className={s.head}>
        <h3 className={s.title}>{group?.name ?? 'Classificação'}</h3>
        {headerAction}
      </header>

      {standingsState === 'EMPTY' && (
        <p className={s.emptyNote}>
          Nenhuma partida finalizada. A classificação aparece quando o primeiro resultado for lançado.
        </p>
      )}

      {standingsState === 'PARTIAL' && (
        <Badge variant="warning">
          {`Classificação parcial — ${pendingMatches} ${pendingMatches === 1 ? 'jogo ainda não disputado' : 'jogos ainda não disputados'}. Não é a classificação oficial.`}
        </Badge>
      )}

      <StandingsTable
        rows={rows}
        teams={teams}
        variant="full"
        renderRowAction={isOrgAdmin ? renderRowAction : undefined}
      />

      {openBlockKey && (
        <TiebreakPanel
          // Re-seed the positions when another block is opened: the panel holds them in state.
          key={openBlockKey}
          rows={blockRows(openBlockKey)}
          standingsState={standingsState}
          isResolved={isBlockResolved(openBlockKey)}
          onSave={async (entries) => {
            await onSetTiebreakOrder(entries)
            setOpenBlockKey(null)
          }}
          onClear={async () => {
            await onClearTiebreakOrder(openBlockKey)
            setOpenBlockKey(null)
          }}
          onCancel={() => setOpenBlockKey(null)}
          errorMessage={errorMessage}
        />
      )}
    </section>
  )
}
