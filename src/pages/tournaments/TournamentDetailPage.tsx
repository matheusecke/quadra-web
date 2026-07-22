import { useMemo, useState } from 'react'
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
import { getAthletes, getCategoryName, getSeasonLabel, getTeams } from '../../features/sports/mock-sports-data'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { EnrollTeamPanel } from '../../features/sports/components/EnrollTeamPanel'
import { TournamentRosterPanel } from '../../features/sports/components/TournamentRosterPanel'
import { CompleteTournamentPanel } from '../../features/sports/components/CompleteTournamentPanel'
import { ChampionHighlight } from '../../features/sports/components/ChampionHighlight'
import { ReopenTournamentPanel } from '../../features/sports/components/ReopenTournamentPanel'
import type { RosterEntryDraft } from '../../features/sports/components/TournamentRosterPanel'
import type { UpdateRosterEntryInput } from '../../services/sportsApi/types'
import { useAddRosterEntry, useChampionSuggestionQuery, useCompleteTournament, useEnrollTeam, useMatchesQuery, useRemoveRosterEntry, useRemoveTournamentTeam, useReopenTournament, useRosterQuery, useTournamentQuery, useTournamentTeamsQuery, useUpdateRosterEntry } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import {
  TOURNAMENT_STATUS_LABELS,
  tournamentStatusVariant,
  formatPeriod,
  hasKnockout,
  matchProgress,
  teamMap,
  tournamentTeamMap,
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
  const { tournamentId: rawTournamentId } = useParams<{ tournamentId: string }>()
  const tournamentId = parsePositiveId(rawTournamentId)
  const navigate = useNavigate()
  const isOrgAdmin = useIsOrgAdmin()
  const { data: tournament, isPending: isLoading, isError, refetch } = useTournamentQuery(tournamentId ?? undefined)
  const { data: matches } = useMatchesQuery({ tournamentId: tournamentId ?? undefined })
  const { data: enrolledJoins } = useTournamentTeamsQuery(tournamentId ?? undefined)
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
  const { data: roster } = useRosterQuery(tournamentId ?? undefined, rosterTournamentTeamId ?? undefined)
  const availableTeams = useMemo(() => {
    const enrolled = new Set((enrolledJoins ?? []).map((entry) => entry.teamId))
    return getTeams().filter((team) => !enrolled.has(team.id)).map((team) => ({ id: team.id, name: team.name }))
  }, [enrolledJoins])

  if (tournamentId == null) {
    return (
      <div className={s.page}>
        <div className={s.bodyFill}>
          <ErrorState title="ID de campeonato inválido." />
        </div>
      </div>
    )
  }

  const teams = teamMap(getTeams())
  const enrolledTeamMap = tournamentTeamMap(enrolledJoins ?? [], teams)
  const championTournamentTeam = enrolledJoins?.find((entry) => entry.id === tournament?.championTournamentTeamId)
  const championName = championTournamentTeam ? teams.get(championTournamentTeam.teamId)?.name ?? championTournamentTeam.displayNameSnapshot : null

  const rosterDisplay = (roster ?? []).map((entry) => ({
    id: entry.id,
    athleteId: entry.athleteId,
    name: getAthletes().find((athlete) => athlete.id === entry.athleteId)?.name ?? String(entry.athleteId),
    jerseyNumber: entry.jerseyNumber,
    role: entry.role,
  }))

  const rosterTeamGlobalId = enrolledJoins?.find((entry) => entry.id === rosterTournamentTeamId)?.teamId
  const availableAthletes = rosterTeamGlobalId
    ? getAthletes()
        .filter((athlete) => athlete.currentTeamId === rosterTeamGlobalId && !(roster ?? []).some((entry) => entry.athleteId === athlete.id))
        .map((athlete) => ({ id: athlete.id, name: athlete.name }))
    : []

  const handleAddRoster = async (draft: RosterEntryDraft) => {
    if (rosterTournamentTeamId == null) return
    try {
      await addRosterEntry.mutateAsync({ tournamentId, tournamentTeamId: rosterTournamentTeamId, ...draft })
      setRosterError('')
    } catch {
      setRosterError('Atleta já está em uma equipe no mesmo campeonato.')
    }
  }

  const handleUpdateRoster = async (id: number, input: UpdateRosterEntryInput) => {
    if (rosterTournamentTeamId == null) return
    await updateRosterEntry.mutateAsync({ id, tournamentId, tournamentTeamId: rosterTournamentTeamId, input })
  }

  const handleRemoveRoster = (id: number) => {
    if (rosterTournamentTeamId == null) return
    removeRosterEntry.mutate({ id, tournamentId, tournamentTeamId: rosterTournamentTeamId })
  }

  const handleEnroll = async (teamId: number) => {
    try {
      await enrollTeam.mutateAsync({ tournamentId, teamId, displayName: teams.get(teamId)?.name ?? String(teamId) })
      setEnrollError('')
    } catch {
      setEnrollError('Equipe já inscrita neste campeonato.')
    }
  }

  const handleComplete = async (championTournamentTeamId: number | null) => {
    try {
      await completeTournament.mutateAsync({ tournamentId, championTournamentTeamId })
      setCompletionError('')
      setIsCompleting(false)
    } catch (error) {
      setCompletionError(error instanceof Error && error.message === 'Champion must have won a bracket slot' ? 'O campeão precisa ser uma equipe que venceu uma vaga do chaveamento.' : error instanceof Error ? error.message : '')
    }
  }

  const handleReopen = async () => {
    try {
      await reopenTournament.mutateAsync({ tournamentId })
      setReopenError('')
      setIsReopening(false)
    } catch (error) {
      setReopenError(error instanceof Error ? error.message : 'Não foi possível reabrir o campeonato.')
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
  const isKnockout = hasKnockout(tournament.format)
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'teams', label: 'Equipes' },
    ...(hasGroupStage ? [{ id: 'groups', label: 'Grupos' }] : []),
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
              <span className={s.mono}>{getSeasonLabel(tournament.seasonId)}</span>
              <span className={s.detailMetaSep}>·</span>
              <span>{getCategoryName(tournament.categoryId)}</span>
            </div>
          </div>
          <div className={s.detailStatusCol}>
            <Badge variant={tournamentStatusVariant(tournament.status)}>
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
            </Badge>
          </div>
        </div>

        {tournament.status === 'COMPLETED' && championName && (
          <ChampionHighlight teamName={championName} />
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
                teams={(enrolledJoins ?? []).map((entry) => ({ tournamentTeamId: entry.id, name: teams.get(entry.teamId)?.name ?? entry.displayNameSnapshot, shortName: teams.get(entry.teamId)?.shortName ?? String(entry.teamId) }))}
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
          <OverviewTab tournament={tournament} matches={allMatches} teams={teams} onSeeBracket={() => handleTabChange('bracket')} />
        )}
        {activeTab === 'teams' && (
          <div className={s.teamsTab}>
            {isOrgAdmin && (
              <div className={s.enrollManage}>
                <EnrollTeamPanel availableTeams={availableTeams} onEnroll={handleEnroll} errorMessage={enrollError} />
                {enrolledJoins && enrolledJoins.length > 0 && (
                  <ul className={s.enrolledList} aria-label="Equipes inscritas">
                    {enrolledJoins.map((join) => {
                      const teamName = teams.get(join.teamId)?.name ?? String(join.teamId)
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
                                  <Button type="button" variant="danger" size="sm" onClick={() => removeTeam.mutate(join.id)}>
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
                                availableAthletes={availableAthletes}
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
          <MatchesTab tournament={tournament} matches={allMatches} teams={teams} tournamentTeams={enrolledTeamMap} isOrgAdmin={isOrgAdmin} />
        )}
        {activeTab === 'bracket' && <BracketTab tournament={tournament} />}
        {activeTab === 'standings' && <StandingsTab tournament={tournament} teams={teams} />}
        {activeTab === 'stats' && <StatsTab tournament={tournament} teams={teams} />}
      </div>
    </div>
  )
}
