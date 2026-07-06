import { useState } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { cn } from '../../../components/ui/cn'
import type { Tournament, Team } from '../../../features/sports/types'
import { consolidatedStandings } from '../../../features/sports/sportsUtils'
import { StandingsTable } from '../parts/StandingsTable'
import s from '../tournaments.module.css'

interface StandingsTabProps {
  tournament: Tournament
  teams: Map<string, Team>
}

export function StandingsTab({ tournament, teams }: StandingsTabProps) {
  const hasGroups = tournament.groups.length > 0
  const multiGroup = tournament.groups.length > 1
  // 'all' = consolidated; otherwise a group id.
  const [view, setView] = useState<string>(multiGroup ? 'all' : (tournament.groups[0]?.id ?? 'all'))

  if (!hasGroups) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState title="Classificação indisponível." description="A tabela aparece quando os grupos e jogos forem definidos." />
      </div>
    )
  }

  const activeGroup = tournament.groups.find((g) => g.id === view)

  return (
    <>
      {multiGroup && (
        <div className={s.sectionHead}>
          <div className={s.segmented}>
            <button type="button" className={cn(s.segBtn, view === 'all' && s.segActive)} onClick={() => setView('all')}>
              Consolidada
            </button>
            {tournament.groups.map((g) => (
              <button
                key={g.id}
                type="button"
                className={cn(s.segBtn, view === g.id && s.segActive)}
                onClick={() => setView(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={s.standCard}>
        <div className={s.standCardHead}>
          {view === 'all' ? 'Classificação consolidada' : (activeGroup?.name ?? 'Classificação')}
        </div>
        <StandingsTable
          rows={view === 'all' ? consolidatedStandings(tournament) : (activeGroup?.standings ?? [])}
          teams={teams}
          variant="full"
          qualified={view === 'all' ? 4 : 2}
        />
      </div>
    </>
  )
}
