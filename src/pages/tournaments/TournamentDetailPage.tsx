import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { getAthletes, getCategoryName, getSeasonLabel, getTeams } from '../../features/sports/mock-sports-data'
import { EnrollTeamPanel } from '../../features/sports/components/EnrollTeamPanel'
import { TournamentRosterPanel } from '../../features/sports/components/TournamentRosterPanel'
import type { RosterEntryDraft } from '../../features/sports/components/TournamentRosterPanel'
import { useAddRosterEntry, useEnrollTeam, useMatchesQuery, useRemoveTournamentTeam, useRosterQuery, useTournamentQuery, useTournamentTeamsQuery } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import {
  TOURNAMENT_STATUS_LABELS,
  tournamentStatusVariant,
  formatPeriod,
  matchProgress,
  teamMap,
} from '../../features/sports/sportsUtils'
import { OverviewTab } from './tabs/OverviewTab'
import { TeamsTab } from './tabs/TeamsTab'
import { MatchesTab } from './tabs/MatchesTab'
import { StandingsTab } from './tabs/StandingsTab'
import { StatsTab } from './tabs/StatsTab'
import s from './tournaments.module.css'

const TABS: TabItem[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'teams', label: 'Equipes' },
  { id: 'matches', label: 'Partidas' },
  { id: 'standings', label: 'Classificação' },
  { id: 'stats', label: 'Estatísticas' },
]

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const isOrgAdmin = useIsOrgAdmin()
  const { data: tournament, isPending: isLoading, isError, refetch } = useTournamentQuery(tournamentId)
  const { data: matches } = useMatchesQuery({ tournamentId })
  const { data: enrolledJoins } = useTournamentTeamsQuery(tournamentId)
  const enrollTeam = useEnrollTeam()
  const removeTeam = useRemoveTournamentTeam()
  const addRosterEntry = useAddRosterEntry()
  const [activeTab, setActiveTab] = useState('overview')
  const [enrollError, setEnrollError] = useState('')
  const [rosterTeamId, setRosterTeamId] = useState<string | null>(null)
  const [rosterError, setRosterError] = useState('')
  const { data: roster } = useRosterQuery(tournamentId, rosterTeamId ?? undefined)
  const teams = teamMap(getTeams())

  const rosterDisplay = (roster ?? []).map((entry) => ({
    athleteId: entry.athleteId,
    name: getAthletes().find((athlete) => athlete.id === entry.athleteId)?.name ?? entry.athleteId,
    jerseyNumber: entry.jerseyNumber,
    role: entry.role,
  }))

  const availableAthletes = rosterTeamId
    ? getAthletes()
        .filter((athlete) => athlete.currentTeamId === rosterTeamId && !(roster ?? []).some((entry) => entry.athleteId === athlete.id))
        .map((athlete) => ({ id: athlete.id, name: athlete.name }))
    : []

  const handleAddRoster = async (draft: RosterEntryDraft) => {
    if (!tournamentId || !rosterTeamId) return
    try {
      await addRosterEntry.mutateAsync({ tournamentId, teamId: rosterTeamId, ...draft })
      setRosterError('')
    } catch {
      setRosterError('Atleta já está em uma equipe no mesmo campeonato.')
    }
  }

  const availableTeams = useMemo(() => {
    const enrolled = new Set(tournament?.teamIds ?? [])
    return getTeams().filter((team) => !enrolled.has(team.id)).map((team) => ({ id: team.id, name: team.name }))
  }, [tournament])

  const handleEnroll = async (teamId: string) => {
    if (!tournamentId) return
    try {
      await enrollTeam.mutateAsync({ tournamentId, teamId })
      setEnrollError('')
    } catch {
      setEnrollError('Equipe já inscrita neste campeonato.')
    }
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/tournaments" className={s.backLink}>
            <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
          </Link>
          <div className={s.detailTitleRow}>
            <div>
              <Skeleton width={280} height={28} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width={220} height={14} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Skeleton width="100%" height={52} />
          </div>
        </div>
        <div className={s.detailBody}>
          <div className={s.skBlock}>
            <Skeleton width="100%" height={80} />
            <Skeleton width="100%" height={200} />
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (isError) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/tournaments" className={s.backLink}>
            <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
          </Link>
        </div>
        <div className={s.bodyFill}>
          <ErrorState title="Não foi possível carregar o campeonato." onRetry={refetch} />
        </div>
      </div>
    )
  }

  // ── Not found ──
  if (!tournament) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/tournaments" className={s.backLink}>
            <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
          </Link>
        </div>
        <div className={s.bodyFill}>
          <EmptyState
            title="Campeonato não encontrado."
            description="Ele pode ter sido removido ou o endereço está incorreto."
            action={<Link to="/tournaments" className={s.athleteLink}>Ver todos os campeonatos</Link>}
          />
        </div>
      </div>
    )
  }

  const allMatches = matches ?? []

  return (
    <div className={s.page}>
      <div className={s.detailHeader}>
        <Link to="/tournaments" className={s.backLink}>
          <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
        </Link>

        <div className={s.detailTitleRow}>
          <div>
            <h1 className={s.detailTitle}>{tournament.name}</h1>
            <div className={s.detailMeta}>
              <span className={s.mono}>{getSeasonLabel(tournament.seasonId)}</span>
              <span className={s.detailMetaSep}>·</span>
              <span>{getCategoryName(tournament.categoryId)}</span>
            </div>
          </div>
          <div className={s.detailStatusCol}>
            <Badge variant={tournamentStatusVariant(tournament.status)}>
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
            </Badge>
            {isOrgAdmin && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/tournaments/${tournamentId}/edit`)}>
                Editar
              </Button>
            )}
          </div>
        </div>

        {/* Compact info strip — not dashboard cards */}
        <div className={s.infoStrip}>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Período</span>
            <span className={s.infoValue}>{formatPeriod(tournament)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Equipes</span>
            <span className={s.infoValue}>{tournament.teamIds.length}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Partidas</span>
            <span className={s.infoValue}>{matchProgress(tournament)}</span>
          </div>
        </div>

        <div className={s.tabsBar}>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="line" />
        </div>
      </div>

      <div className={s.detailBody}>
        {activeTab === 'overview' && (
          <OverviewTab tournament={tournament} matches={allMatches} teams={teams} />
        )}
        {activeTab === 'teams' && (
          <div className={s.teamsTab}>
            {isOrgAdmin && (
              <div className={s.enrollManage}>
                <EnrollTeamPanel availableTeams={availableTeams} onEnroll={handleEnroll} errorMessage={enrollError} />
                {enrolledJoins && enrolledJoins.length > 0 && (
                  <ul className={s.enrolledList}>
                    {enrolledJoins.map((join) => (
                      <li key={join.id} className={s.enrolledRow}>
                        <span>{teams.get(join.teamId)?.name ?? join.teamId}</span>
                        <div className={s.enrolledActions}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRosterTeamId((current) => (current === join.teamId ? null : join.teamId))}
                          >
                            Elenco
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeTeam.mutate(join.id)}>
                            Remover
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {rosterTeamId && (
                  <TournamentRosterPanel
                    roster={rosterDisplay}
                    availableAthletes={availableAthletes}
                    onAdd={handleAddRoster}
                    errorMessage={rosterError}
                  />
                )}
              </div>
            )}
            <TeamsTab tournament={tournament} teams={teams} />
          </div>
        )}
        {activeTab === 'matches' && (
          <MatchesTab tournament={tournament} matches={allMatches} teams={teams} />
        )}
        {activeTab === 'standings' && <StandingsTab tournament={tournament} teams={teams} />}
        {activeTab === 'stats' && <StatsTab tournament={tournament} teams={teams} />}
      </div>
    </div>
  )
}
