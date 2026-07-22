import { useState } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { StandingsCard } from '../../../features/sports/components/StandingsCard'
import { useClearTiebreakOrder, useSetTiebreakOrder, useStandingsQuery } from '../../../features/sports/queries'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import type { Tournament, Team } from '../../../features/sports/types'
import s from '../tournaments.module.css'

interface StandingsTabProps {
  tournament: Tournament
  teams: Map<number, Team>
}

/**
 * The classification of a LEAGUE — the only format where the tournament is a single group and
 * the general table *is* the official classification (UI spec §7.5). Formats with a group stage
 * show their tables inside the Grupos tab, and a pure knockout has no classification at all.
 */
export function StandingsTab({ tournament, teams }: StandingsTabProps) {
  const isOrgAdmin = useIsOrgAdmin()
  const { data: envelopes, isPending, isError, refetch } = useStandingsQuery(tournament.id)
  const setTiebreak = useSetTiebreakOrder()
  const clearTiebreak = useClearTiebreakOrder()
  const [tiebreakError, setTiebreakError] = useState('')

  if (isPending) {
    return (
      <div className={s.tabEmpty}>
        <Skeleton width="100%" height={240} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={s.tabEmpty}>
        <ErrorState title="Não foi possível carregar a classificação." onRetry={() => refetch()} />
      </div>
    )
  }

  const envelope = envelopes?.[0]
  if (!envelope) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState title="Classificação indisponível." description="A tabela aparece quando houver equipes inscritas." />
      </div>
    )
  }

  return (
    <StandingsCard
      envelope={envelope}
      teams={teams}
      isOrgAdmin={isOrgAdmin}
      errorMessage={tiebreakError}
      onSetTiebreakOrder={async (entries) => {
        try {
          await setTiebreak.mutateAsync({ tournamentId: tournament.id, entries })
          setTiebreakError('')
        } catch {
          setTiebreakError('A composição do empate mudou. Recarregue a classificação.')
          await refetch()
        }
      }}
      onClearTiebreakOrder={async (blockKey) => {
        await clearTiebreak.mutateAsync({ tournamentId: tournament.id, blockKey })
      }}
    />
  )
}
