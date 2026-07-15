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
import { CompleteTournamentPanel } from '../../features/sports/components/CompleteTournamentPanel'
import type { RosterEntryDraft } from '../../features/sports/components/TournamentRosterPanel'
import type { UpdateRosterEntryInput } from '../../services/sportsApi/types'
import { useAddRosterEntry, useChampionSuggestionQuery, useCompleteTournament, useEnrollTeam, useMatchesQuery, useRemoveRosterEntry, useRemoveTournamentTeam, useReopenTournament, useRosterQuery, useTournamentQuery, useTournamentTeamsQuery, useUpdateRosterEntry } from '../../features/sports/queries'
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
import { GroupsTab } from './tabs/GroupsTab'
import { StandingsTab } from './tabs/StandingsTab'
import { StatsTab } from './tabs/StatsTab'
import { BracketTab } from './tabs/BracketTab'
import s from './tournaments.module.css'

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
  const updateRosterEntry = useUpdateRosterEntry()
  const removeRosterEntry = useRemoveRosterEntry()
  const completeTournament = useCompleteTournament()
  const reopenTournament = useReopenTournament()
  const { data: championSuggestion } = useChampionSuggestionQuery(tournamentId)
  const [activeTab, setActiveTab] = useState('overview')
  const [enrollError, setEnrollError] = useState('')
  const [rosterTeamId, setRosterTeamId] = useState<string | null>(null)
  const [rosterError, setRosterError] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionError, setCompletionError] = useState('')
  const { data: roster } = useRosterQuery(tournamentId, rosterTeamId ?? undefined)
  const teams = teamMap(getTeams())
  const championTournamentTeam = enrolledJoins?.find((entry) => entry.id === tournament?.championTournamentTeamId)
  const championName = championTournamentTeam ? teams.get(championTournamentTeam.teamId)?.name ?? championTournamentTeam.displayNameSnapshot : null

  const rosterDisplay = (roster ?? []).map((entry) => ({
    id: entry.id,
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

  const handleUpdateRoster = async (id: string, input: UpdateRosterEntryInput) => {
    if (!tournamentId || !rosterTeamId) return
    await updateRosterEntry.mutateAsync({ id, tournamentId, teamId: rosterTeamId, input })
  }

  const handleRemoveRoster = (id: string) => {
    if (!tournamentId || !rosterTeamId) return
    removeRosterEntry.mutate({ id, tournamentId, teamId: rosterTeamId })
  }

  const availableTeams = useMemo(() => {
    const enrolled = new Set(tournament?.teamIds ?? [])
    return getTeams().filter((team) => !enrolled.has(team.id)).map((team) => ({ id: team.id, name: team.name }))
  }, [tournament])

  const handleEnroll = async (teamId: string) => {
    if (!tournamentId) return
    try {
      await enrollTeam.mutateAsync({ tournamentId, teamId, displayName: teams.get(teamId)?.name ?? teamId })
      setEnrollError('')
    } catch {
      setEnrollError('Equipe já inscrita neste campeonato.')
    }
  }

  const handleComplete = async (championTournamentTeamId: string | null) => {
    if (!tournamentId) return
    try {
      await completeTournament.mutateAsync({ tournamentId, championTournamentTeamId })
      setCompletionError('')
      setIsCompleting(false)
    } catch (error) {
      setCompletionError(error instanceof Error && error.message === 'Champion must have won a bracket slot' ? 'O campeão precisa ser uma equipe que venceu uma vaga do chaveamento.' : error instanceof Error ? error.message : '')
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

  // Grupos and Classificação are mutually exclusive; a pure knockout has neither. §7.5
  const hasGroupStage = tournament.format === 'GROUP_STAGE' || tournament.format === 'GROUP_STAGE_KNOCKOUT'
  const hasKnockout = tournament.format === 'KNOCKOUT' || tournament.format === 'GROUP_STAGE_KNOCKOUT'
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'teams', label: 'Equipes' },
    ...(hasGroupStage ? [{ id: 'groups', label: 'Grupos' }] : []),
    { id: 'matches', label: 'Partidas' },
    ...(hasKnockout ? [{ id: 'bracket', label: 'Chaveamento' }] : []),
    ...(tournament.format === 'LEAGUE' ? [{ id: 'standings', label: 'Classificação' }] : []),
    { id: 'stats', label: 'Estatísticas' },
  ]

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
            {tournament.status === 'COMPLETED' && championName && <span>🏆 Campeão: {championName}</span>}
            {isOrgAdmin && tournament.status === 'IN_PROGRESS' && (
              <Button variant="secondary" size="sm" onClick={() => setIsCompleting(true)}>Encerrar campeonato</Button>
            )}
            {isOrgAdmin && tournament.status === 'COMPLETED' && (
              <Button variant="secondary" size="sm" onClick={() => { if (tournamentId) void reopenTournament.mutateAsync({ tournamentId }) }}>Reabrir</Button>
            )}
          </div>
        </div>
        {isCompleting && (
          <CompleteTournamentPanel
            teams={(enrolledJoins ?? []).map((entry) => ({ tournamentTeamId: entry.id, name: teams.get(entry.teamId)?.name ?? entry.displayNameSnapshot, shortName: teams.get(entry.teamId)?.shortName ?? entry.teamId }))}
            suggestion={championSuggestion ?? null}
            requiresChampion={tournament.format !== 'GROUP_STAGE'}
            onComplete={handleComplete}
            onCancel={() => { setIsCompleting(false); setCompletionError('') }}
            errorMessage={completionError}
          />
        )}

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
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="line" />
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
                    onUpdate={handleUpdateRoster}
                    onRemove={handleRemoveRoster}
                    errorMessage={rosterError}
                  />
                )}
              </div>
            )}
            <TeamsTab tournament={tournament} teams={teams} />
          </div>
        )}
        {activeTab === 'groups' && <GroupsTab tournament={tournament} teams={teams} />}
        {activeTab === 'matches' && (
          <MatchesTab tournament={tournament} matches={allMatches} teams={teams} />
        )}
        {activeTab === 'bracket' && <BracketTab tournament={tournament} />}
        {activeTab === 'standings' && <StandingsTab tournament={tournament} teams={teams} />}
        {activeTab === 'stats' && <StatsTab tournament={tournament} teams={teams} />}
      </div>
    </div>
  )
}
