import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { Collapse } from '../../components/ui/Collapse'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { EnrollTeamPanel } from '../../features/sports/components/EnrollTeamPanel'
import { TournamentRosterPanel } from '../../features/sports/components/TournamentRosterPanel'
import { CompleteTournamentPanel } from '../../features/sports/components/CompleteTournamentPanel'
import { ChampionHighlight } from '../../features/sports/components/ChampionHighlight'
import { ReopenTournamentPanel } from '../../features/sports/components/ReopenTournamentPanel'
import type { RosterEntryDraft, RosterRole } from '../../features/sports/components/TournamentRosterPanel'
import * as sportsApi from '../../services/sportsApi'
import { useAddRosterEntry, useCategoriesQuery, useChampionSuggestionQuery, useCompleteTournament, useEnrollTeam, useRemoveRosterEntry, useRemoveTournamentTeam, useReopenTournament, useRosterQuery, useSeasonsQuery, useTeamsQuery, useTournamentMatchesQuery, useTournamentQuery, useTournamentTeamsQuery, useUpdateRosterEntry } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import { apiErrorCode, apiErrorMessage } from '../../services/apiError'
import {
  TOURNAMENT_STATUS_LABELS,
  tournamentStatusVariant,
  formatPeriod,
  hasGroupStage,
  hasKnockout,
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

const COMPLETE_ERRORS: Record<string, string> = {
  CHAMPION_REQUIRED: 'Selecione a equipe campeã.',
  CHAMPION_NOT_ALLOWED: 'Um campeonato de fase de grupos não tem campeão.',
  INVALID_CHAMPION: 'A equipe escolhida não está inscrita ou não venceu a decisão.',
  INVALID_STATUS_TRANSITION: 'O status do campeonato mudou. Recarregue a página.',
}

const ENROLLMENT_MESSAGES: Record<string, string> = {
  DUPLICATE_RECORD: 'Equipe já inscrita neste campeonato.',
  INVALID_TEAM: 'A equipe não está disponível para esta organização.',
  TOURNAMENT_NOT_MUTABLE: 'Este campeonato não permite mais alterações.',
  REGISTRATION_IN_USE: 'A inscrição já está em uso pelo chaveamento.',
}

const ROSTER_MESSAGES: Record<string, string> = {
  DUPLICATE_RECORD: 'A pessoa já está ativa neste elenco.',
  ATHLETE_ALREADY_REGISTERED: 'Atleta já está em outra equipe neste campeonato.',
  INVALID_ROSTER_MEMBER: 'A pessoa não possui vínculo ativo com esta equipe.',
  INVALID_ROSTER_ROLE: 'O papel escolhido não corresponde ao vínculo ativo.',
  INACTIVE_REGISTRATION: 'A inscrição ou o membro não está ativo.',
  TOURNAMENT_NOT_MUTABLE: 'Este campeonato não permite mais alterações.',
}

export function TournamentDetailPage() {
  const { tournamentId: rawTournamentId } = useParams<{ tournamentId: string }>()
  const tournamentId = parsePositiveId(rawTournamentId)
  const navigate = useNavigate()
  const isOrgAdmin = useIsOrgAdmin()
  const tournamentQuery = useTournamentQuery(tournamentId ?? undefined)
  const { data: tournament } = tournamentQuery
  const matchesQuery = useTournamentMatchesQuery(tournamentId ?? undefined)
  const matches = matchesQuery.data ?? []
  const tournamentTeamsQuery = useTournamentTeamsQuery(tournamentId ?? undefined)
  const { data: enrolledJoins } = tournamentTeamsQuery
  const teamsQuery = useTeamsQuery()
  const seasonsQuery = useSeasonsQuery()
  const categoriesQuery = useCategoriesQuery()
  const enrollTeam = useEnrollTeam()
  const removeTeam = useRemoveTournamentTeam()
  const addRosterEntry = useAddRosterEntry()
  const updateRosterEntry = useUpdateRosterEntry()
  const removeRosterEntry = useRemoveRosterEntry()
  const completeTournament = useCompleteTournament()
  const reopenTournament = useReopenTournament()
  const { data: championSuggestion } = useChampionSuggestionQuery(tournamentId ?? undefined)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') ?? 'overview')

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        return next
      },
      { replace: true },
    )
  }
  const [enrollError, setEnrollError] = useState('')
  const [rosterTournamentTeamId, setRosterTournamentTeamId] = useState<number | null>(null)
  const [rosterError, setRosterError] = useState('')
  const [confirmingTeamId, setConfirmingTeamId] = useState<number | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionError, setCompletionError] = useState('')
  const [isReopening, setIsReopening] = useState(false)
  const [reopenError, setReopenError] = useState('')
  const rosterQuery = useRosterQuery(rosterTournamentTeamId ?? undefined)
  const { data: roster } = rosterQuery

  const isLoading = tournamentQuery.isPending || tournamentTeamsQuery.isPending || teamsQuery.isPending || seasonsQuery.isPending || categoriesQuery.isPending
  const isError = tournamentQuery.isError || tournamentTeamsQuery.isError || teamsQuery.isError || seasonsQuery.isError || categoriesQuery.isError
  const refetch = () => {
    tournamentQuery.refetch()
    tournamentTeamsQuery.refetch()
    teamsQuery.refetch()
    seasonsQuery.refetch()
    categoriesQuery.refetch()
  }

  if (tournamentId == null) {
    return (
      <div className={s.page}>
        <div className={s.bodyFill}>
          <ErrorState title="ID de campeonato inválido." />
        </div>
      </div>
    )
  }

  const teams = teamMap(teamsQuery.data ?? [])
  const seasonLabel = seasonsQuery.data?.find((season) => season.id === tournament?.seasonId)?.label
    ?? String(tournament?.seasonId ?? '')
  const categoryName = tournament?.categoryId == null
    ? '—'
    : categoriesQuery.data?.find((category) => category.id === tournament.categoryId)?.name
      ?? String(tournament.categoryId)
  const championTournamentTeam = enrolledJoins?.find((entry) => entry.id === tournament?.championTournamentTeamId)
  const championName = championTournamentTeam?.displayNameSnapshot ?? null
  const championTeamId = championTournamentTeam?.teamId ?? null

  const rosterDisplay = (roster ?? []).map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    name: entry.displayNameSnapshot,
    jerseyNumber: entry.jerseyNumber,
    role: entry.role,
  }))

  const rosterTeamGlobalId = enrolledJoins?.find((entry) => entry.id === rosterTournamentTeamId)?.teamId

  const searchEnrollmentTeams = async (q: string) => {
    const enrolledTeamIds = new Set((enrolledJoins ?? []).map((entry) => entry.teamId))
    return (await sportsApi.searchTeams(q))
      .filter((team) => !enrolledTeamIds.has(team.id))
      .map((team) => ({ id: team.id, label: team.name, secondary: team.shortName }))
  }

  const searchRosterCandidates = async (q: string, role: RosterRole) => {
    if (rosterTeamGlobalId == null) return []
    return (await sportsApi.searchRosterCandidates({ q, teamId: rosterTeamGlobalId, role }))
      .map((candidate) => ({
        id: candidate.id,
        label: candidate.name,
        secondary: candidate.jerseyNumber == null ? undefined : `Camisa ${candidate.jerseyNumber}`,
      }))
  }

  const handleAddRoster = async (draft: RosterEntryDraft) => {
    if (rosterTournamentTeamId == null) return
    try {
      await addRosterEntry.mutateAsync({ tournamentTeamId: rosterTournamentTeamId, ...draft })
      setRosterError('')
    } catch (error) {
      setRosterError(ROSTER_MESSAGES[apiErrorCode(error) ?? ''] ?? 'Não foi possível adicionar ao elenco.')
      throw error
    }
  }

  const handleUpdateRoster = async (id: number, input: { jerseyNumber?: number | null; role?: RosterRole }) => {
    if (rosterTournamentTeamId == null) return
    try {
      await updateRosterEntry.mutateAsync({ id, tournamentTeamId: rosterTournamentTeamId, input })
      setRosterError('')
    } catch (error) {
      setRosterError(ROSTER_MESSAGES[apiErrorCode(error) ?? ''] ?? 'Não foi possível atualizar o elenco.')
      throw error
    }
  }

  const handleRemoveRoster = async (id: number) => {
    if (rosterTournamentTeamId == null) return
    try {
      await removeRosterEntry.mutateAsync({ id, tournamentTeamId: rosterTournamentTeamId })
      setRosterError('')
    } catch (error) {
      setRosterError(ROSTER_MESSAGES[apiErrorCode(error) ?? ''] ?? 'Não foi possível remover do elenco.')
      throw error
    }
  }

  const handleEnroll = async (teamId: number) => {
    try {
      await enrollTeam.mutateAsync({ tournamentId, teamId })
      setEnrollError('')
    } catch (error) {
      setEnrollError(ENROLLMENT_MESSAGES[apiErrorCode(error) ?? ''] ?? 'Não foi possível inscrever a equipe.')
      throw error
    }
  }

  const handleRemoveTeam = async (id: number) => {
    try {
      await removeTeam.mutateAsync(id)
      setEnrollError('')
      setConfirmingTeamId(null)
    } catch (error) {
      setEnrollError(ENROLLMENT_MESSAGES[apiErrorCode(error) ?? ''] ?? 'Não foi possível remover a equipe.')
    }
  }

  const handleComplete = async (championTournamentTeamId: number | null) => {
    try {
      await completeTournament.mutateAsync({ tournamentId, championTournamentTeamId })
      setCompletionError('')
      setIsCompleting(false)
    } catch (error) {
      setCompletionError(COMPLETE_ERRORS[apiErrorCode(error) ?? ''] ?? 'Não foi possível encerrar o campeonato.')
    }
  }

  const handleReopen = async () => {
    try {
      await reopenTournament.mutateAsync({ tournamentId })
      setReopenError('')
      setIsReopening(false)
    } catch (error) {
      setReopenError(COMPLETE_ERRORS[apiErrorCode(error) ?? ''] ?? 'Não foi possível reabrir o campeonato.')
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

  // ── Not found (the tournament itself, not a sibling resource) ──
  const tournamentNotFound = apiErrorCode(tournamentQuery.error) === 'RECORD_NOT_FOUND'
    && apiErrorMessage(tournamentQuery.error) === 'Tournament not found'
  if (tournamentNotFound) {
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

  // ── Error ──
  if (isError || !tournament) {
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

  const allMatches = matches

  // Grupos and Classificação are mutually exclusive; a pure knockout has neither. §7.5
  const isGroupStage = hasGroupStage(tournament.format)
  const isKnockout = hasKnockout(tournament.format)
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'teams', label: 'Equipes' },
    ...(isGroupStage ? [{ id: 'groups', label: 'Grupos' }] : []),
    { id: 'matches', label: 'Partidas' },
    ...(isKnockout ? [{ id: 'bracket', label: 'Chaveamento' }] : []),
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
              <span className={s.mono}>{seasonLabel}</span>
              <span className={s.detailMetaSep}>·</span>
              <span>{categoryName}</span>
            </div>
          </div>
          <div className={s.detailStatusCol}>
            <Badge variant={tournamentStatusVariant(tournament.status)}>
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
            </Badge>
          </div>
        </div>

        {tournament.status === 'COMPLETED' && championName && (
          <ChampionHighlight teamName={championName} teamId={championTeamId} />
        )}

        {/* Compact info strip — not dashboard cards */}
        <div className={s.infoStrip}>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Período</span>
            <span className={s.infoValue}>{formatPeriod(tournament)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Equipes</span>
            <span className={s.infoValue}>{tournament.enrolledTeamCount}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Partidas</span>
            <span className={s.infoValue}>{matchProgress(tournament)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Inscrições</span>
            <span className={s.infoValue}>
              {tournament.isRegistrationOpen && tournament.status === 'REGISTRATION' ? 'Abertas' : 'Fechadas'}
            </span>
          </div>
        </div>

        {isOrgAdmin && (
          <section className={s.adminRegion} aria-label="Administração">
            <span className={s.adminLabel}>Administração</span>
            <div className={s.adminRow}>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/tournaments/${tournamentId}/edit`)}>
                Editar campeonato
              </Button>
              {tournament.status === 'IN_PROGRESS' && (
                <Button variant="secondary" size="sm" onClick={() => setIsCompleting(true)}>
                  Encerrar campeonato
                </Button>
              )}
              {tournament.status === 'COMPLETED' && (
                <Button variant="secondary" size="sm" onClick={() => setIsReopening(true)}>
                  Reabrir campeonato
                </Button>
              )}
            </div>
            {isCompleting && (
              <CompleteTournamentPanel
                teams={(enrolledJoins ?? []).map((entry) => ({ tournamentTeamId: entry.id, name: entry.displayNameSnapshot, shortName: teams.get(entry.teamId)?.shortName ?? String(entry.teamId) }))}
                suggestion={championSuggestion ?? null}
                requiresChampion={tournament.format !== 'GROUP_STAGE'}
                onComplete={handleComplete}
                onCancel={() => { setIsCompleting(false); setCompletionError('') }}
                errorMessage={completionError}
              />
            )}
            {isReopening && (
              <ReopenTournamentPanel
                championName={championName}
                onConfirm={handleReopen}
                onCancel={() => { setIsReopening(false); setReopenError('') }}
                loading={reopenTournament.isPending}
                errorMessage={reopenError}
              />
            )}
          </section>
        )}

        <div className={s.tabsBar}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} variant="line" />
        </div>
      </div>

      <div className={s.detailBody}>
        {activeTab === 'overview' && (
          <OverviewTab
            tournament={tournament}
            matches={allMatches}
            matchesPending={matchesQuery.isPending}
            matchesError={matchesQuery.isError}
            onRetryMatches={() => matchesQuery.refetch()}
            teams={teams}
            onSeeBracket={() => handleTabChange('bracket')}
          />
        )}
        {activeTab === 'teams' && (
          <div className={s.teamsTab}>
            {isOrgAdmin && (
              <div className={s.enrollManage}>
                <EnrollTeamPanel onSearch={searchEnrollmentTeams} onEnroll={handleEnroll} errorMessage={enrollError} />
                {enrolledJoins && enrolledJoins.length > 0 && (
                  <ul className={s.enrolledList} aria-label="Equipes inscritas">
                    {enrolledJoins.map((join) => {
                      const teamName = join.displayNameSnapshot
                      const isOpen = rosterTournamentTeamId === join.id
                      const isConfirming = confirmingTeamId === join.id
                      const panelId = `roster-panel-${join.id}`
                      return (
                        <li key={join.id} className={s.enrolledItem}>
                          <div className={s.enrolledRow}>
                            <span>{isConfirming ? `Remover ${teamName} do campeonato?` : teamName}</span>
                            <div className={s.enrolledActions}>
                              {isConfirming ? (
                                <>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingTeamId(null)}>
                                    Cancelar
                                  </Button>
                                  <Button type="button" variant="danger" size="sm" loading={removeTeam.isPending} onClick={() => handleRemoveTeam(join.id)}>
                                    Confirmar
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    aria-expanded={isOpen}
                                    aria-controls={panelId}
                                    className={isOpen ? s.rosterToggleActive : undefined}
                                    onClick={() => setRosterTournamentTeamId((current) => (current === join.id ? null : join.id))}
                                  >
                                    Elenco
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingTeamId(join.id)}>
                                    Remover
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <Collapse
                            open={isOpen}
                            id={panelId}
                            role={isOpen ? 'region' : undefined}
                            aria-label={isOpen ? `Elenco ${teamName}` : undefined}
                          >
                            {isOpen ? (
                              <TournamentRosterPanel
                                roster={rosterDisplay}
                                isLoading={rosterQuery.isPending}
                                isError={rosterQuery.isError}
                                onRetry={rosterQuery.refetch}
                                onSearchCandidates={searchRosterCandidates}
                                onAdd={handleAddRoster}
                                onUpdate={handleUpdateRoster}
                                onRemove={handleRemoveRoster}
                                errorMessage={rosterError}
                              />
                            ) : null}
                          </Collapse>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
            <TeamsTab tournament={tournament} teams={teams} />
          </div>
        )}
        {activeTab === 'groups' && <GroupsTab tournament={tournament} teams={teams} />}
        {activeTab === 'matches' && (
          <MatchesTab
            tournament={tournament}
            matches={allMatches}
            isPending={matchesQuery.isPending}
            isError={matchesQuery.isError}
            onRetry={() => matchesQuery.refetch()}
            isOrgAdmin={isOrgAdmin}
          />
        )}
        {activeTab === 'bracket' && <BracketTab tournament={tournament} onRefetchTournament={() => tournamentQuery.refetch()} />}
        {activeTab === 'standings' && <StandingsTab tournament={tournament} teams={teams} />}
        {activeTab === 'stats' && <StatsTab tournament={tournament} />}
      </div>
    </div>
  )
}
