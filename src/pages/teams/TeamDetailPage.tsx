import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { useTeamSummaryQuery } from '../../features/sports/queries'
import {
  TEAM_PROFILE_STATUS_LABELS,
  formatTeamLocation,
  teamProfileStatusVariant,
} from '../../features/sports/sportsUtils'
import s from './teamDetail.module.css'

export function TeamDetailPage() {
  const { teamId: rawTeamId } = useParams<{ teamId: string }>()
  const teamId = parsePositiveId(rawTeamId)
  const navigate = useNavigate()

  const summaryQuery = useTeamSummaryQuery(teamId ?? undefined)

  const backButton = (
    <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
      <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
    </button>
  )

  if (teamId == null) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>{backButton}</div>
        <div className={s.bodyFill}>
          <ErrorState title="ID de equipe inválido." />
        </div>
      </div>
    )
  }

  if (summaryQuery.isPending) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          {backButton}
          <div className={s.skBlock}>
            <Skeleton width={320} height={28} />
            <Skeleton width={240} height={16} />
            <Skeleton width="100%" height={92} />
            <Skeleton width="100%" height={48} />
          </div>
        </div>
      </div>
    )
  }

  if (summaryQuery.isError) {
    const notFound = axios.isAxiosError(summaryQuery.error)
      && summaryQuery.error.response?.status === 404
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>{backButton}</div>
        <div className={s.bodyFill}>
          {notFound ? (
            <EmptyState title="Equipe não encontrada." />
          ) : (
            <ErrorState
              title="Não foi possível carregar a equipe."
              onRetry={() => void summaryQuery.refetch()}
            />
          )}
        </div>
      </div>
    )
  }

  const summary = summaryQuery.data
  if (!summary) return null

  const { team } = summary

  return (
    <div className={s.page}>
      <div className={s.detailHeader} data-testid="team-header">
        {backButton}

        <div className={s.heroRow}>
          <div className={s.crest}>{team.shortName}</div>
          <div className={s.heroMain}>
            <h1 className={s.title}>{team.name}</h1>
            <div className={s.meta}>
              <span>{formatTeamLocation(team.city, team.state)}</span>
            </div>
          </div>
          <Badge variant={teamProfileStatusVariant(team.status)}>
            {TEAM_PROFILE_STATUS_LABELS[team.status]}
          </Badge>
        </div>
      </div>

      <div className={s.detailBody} />
    </div>
  )
}
