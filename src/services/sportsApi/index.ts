// SWAP SEAM: replace these bodies with axios calls to /tournaments/* when the API exists. Signatures stay.
import {
  getAthletes,
  getAthleteById,
  getAthleteMatches as getMockAthleteMatches,
  getAthleteSummaryById,
  getAthleteTournamentStats as getMockAthleteTournamentStats,
  getMatchDetailById,
  getTeams,
  seedCategories,
  seedGroupMembership,
  seedMatches,
  seedBracketRounds,
  seedSeasons,
  seedTournaments,
} from '../../features/sports/mock-sports-data'
import type { MatchDetail, StandingsEnvelope } from '../../features/sports/types'
import { createSportsStore } from './store'
import type { BracketRound, BracketSlot, RosterEntry, TournamentGroup, TournamentGroupTeam, TournamentTeam } from './store'
import type {
  AssignGroupTeamInput,
  ClearTiebreakOrderInput,
  CompleteTournamentInput,
  CreateBracketRoundInput,
  CreateBracketSlotInput,
  CreateCategoryInput,
  CreateGroupInput,
  CreateSeasonInput,
  CreateTournamentInput,
  EnrollTeamInput,
  LinkSlotMatchInput,
  RosterEntryInput,
  ReopenTournamentInput,
  ScheduleMatchInput,
  SetTiebreakOrderInput,
  SetSlotWinnerInput,
  SubmitMatchResultInput,
  UpdateSeasonInput,
  UpdateBracketRoundInput,
  UpdateBracketSlotInput,
  UpdateRosterEntryInput,
  UpdateTournamentInput,
} from './types'

const seedMatchDetails = seedMatches
  .map((match) => getMatchDetailById(match.id))
  .filter((detail): detail is MatchDetail => Boolean(detail))

const teamNameById = new Map(getTeams().map((team) => [team.id, team.name]))

const seedTournamentTeams: TournamentTeam[] = seedTournaments.flatMap((tournament) =>
  tournament.teamIds.map((teamId) => ({
    id: `tournament-team-${tournament.id}-${teamId}`,
    tournamentId: tournament.id,
    teamId,
    displayNameSnapshot: teamNameById.get(teamId) ?? teamId,
    seed: null,
    tiebreakOrder: null,
    tiebreakBlockKey: null,
  })),
)

const seedBracketRoundRows: BracketRound[] = seedBracketRounds.map((round, roundIndex) => ({
  id: `seed-bracket-round-${roundIndex + 1}`,
  tournamentId: 'puc-geral-2026',
  number: roundIndex + 1,
  label: round.name,
}))

const seedInvernoBracketRounds: BracketRound[] = [
  { id: 'seed-bracket-round-puc-inverno-2026-1', tournamentId: 'puc-inverno-2026', number: 1, label: 'Semifinais' },
  { id: 'seed-bracket-round-puc-inverno-2026-2', tournamentId: 'puc-inverno-2026', number: 2, label: 'Final' },
]

const seedBracketSlots: BracketSlot[] = seedBracketRounds.flatMap((round, roundIndex) =>
  round.matches.map((slot, position) => ({
    id: `seed-bracket-${slot.id}`,
    tournamentId: 'puc-geral-2026',
    roundId: `seed-bracket-round-${roundIndex + 1}`,
    position: position + 1,
    label: null,
    homeTournamentTeamId: slot.homeTeamId ? `tournament-team-puc-geral-2026-${slot.homeTeamId}` : null,
    awayTournamentTeamId: slot.awayTeamId ? `tournament-team-puc-geral-2026-${slot.awayTeamId}` : null,
    matchId: slot.matchId,
    winnerTournamentTeamId: slot.winnerId ? `tournament-team-puc-geral-2026-${slot.winnerId}` : null,
  })),
)

const seedInvernoBracketSlots: BracketSlot[] = [
  { id: 'seed-bracket-inverno-sf1', tournamentId: 'puc-inverno-2026', roundId: 'seed-bracket-round-puc-inverno-2026-1', position: 1, label: null, homeTournamentTeamId: 'tournament-team-puc-inverno-2026-puc-time-1', awayTournamentTeamId: 'tournament-team-puc-inverno-2026-puc-time-4', matchId: 'puc-inverno-m13', winnerTournamentTeamId: null },
  { id: 'seed-bracket-inverno-sf2', tournamentId: 'puc-inverno-2026', roundId: 'seed-bracket-round-puc-inverno-2026-1', position: 2, label: null, homeTournamentTeamId: 'tournament-team-puc-inverno-2026-puc-time-5', awayTournamentTeamId: 'tournament-team-puc-inverno-2026-puc-time-8', matchId: 'puc-inverno-m14', winnerTournamentTeamId: null },
  { id: 'seed-bracket-inverno-f1', tournamentId: 'puc-inverno-2026', roundId: 'seed-bracket-round-puc-inverno-2026-2', position: 1, label: null, homeTournamentTeamId: 'tournament-team-puc-inverno-2026-puc-time-1', awayTournamentTeamId: 'tournament-team-puc-inverno-2026-puc-time-5', matchId: 'puc-inverno-m15', winnerTournamentTeamId: null },
]

const seedRosterEntries: RosterEntry[] = seedTournamentTeams.flatMap((tournamentTeam) =>
  getAthletes()
    .filter((athlete) => athlete.currentTeamId === tournamentTeam.teamId)
    .map((athlete) => ({
      id: `tournament-roster-${tournamentTeam.tournamentId}-${tournamentTeam.teamId}-${athlete.id}`,
      tournamentId: tournamentTeam.tournamentId,
      teamId: tournamentTeam.teamId,
      athleteId: athlete.id,
      jerseyNumber: athlete.number,
      role: 'ATHLETE' as const,
    })),
)

/** Same id shape the mock stamps on its group matches — the two sides agree without a lookup table. */
const seedTournamentGroups: TournamentGroup[] = seedGroupMembership.map((g) => ({
  id: `seed-group-${g.tournamentId}-${g.groupName}`,
  tournamentId: g.tournamentId,
  name: g.groupName,
  sortOrder: g.groupName.charCodeAt(g.groupName.length - 1),
}))

const seedTournamentGroupTeams: TournamentGroupTeam[] = seedGroupMembership.flatMap((g) =>
  g.teamIds.map((teamId) => ({
    id: `seed-group-team-${g.tournamentId}-${g.groupName}-${teamId}`,
    tournamentId: g.tournamentId,
    groupId: `seed-group-${g.tournamentId}-${g.groupName}`,
    teamId,
  })),
)

const store = createSportsStore({
  seasons: seedSeasons,
  categories: seedCategories,
  tournaments: seedTournaments,
  matches: seedMatches,
  tournamentTeams: seedTournamentTeams,
  rosterEntries: seedRosterEntries,
  tournamentGroups: seedTournamentGroups,
  tournamentGroupTeams: seedTournamentGroupTeams,
  bracketRounds: [...seedBracketRoundRows, ...seedInvernoBracketRounds],
  bracketSlots: [...seedBracketSlots, ...seedInvernoBracketSlots],
  matchDetails: seedMatchDetails,
})

// ── Seasons ──────────────────────────────────────────────────────────────────
export const getSeasons = () => Promise.resolve(store.listSeasons())
export const createSeason = (input: CreateSeasonInput) => Promise.resolve(store.createSeason(input))
export const updateSeason = (id: string, input: UpdateSeasonInput) => Promise.resolve(store.updateSeason(id, input))

// ── Categories ─────────────────────────────────────────────────────────────────
export const getCategories = () => Promise.resolve(store.listCategories())
export const createCategory = (input: CreateCategoryInput) => Promise.resolve(store.createCategory(input))

// ── Tournaments ──────────────────────────────────────────────────────────────────
export const getTournaments = () => Promise.resolve(store.listTournaments())
export const getTournament = (id: string) => Promise.resolve(store.getTournament(id))
export const createTournament = (input: CreateTournamentInput) => Promise.resolve(store.createTournament(input))
export const updateTournament = (id: string, input: UpdateTournamentInput) => Promise.resolve(store.updateTournament(id, input))
export const completeTournament = (input: CompleteTournamentInput) => Promise.resolve(store.completeTournament(input))
export const reopenTournament = (input: ReopenTournamentInput) => Promise.resolve(store.reopenTournament(input))
export const getChampionSuggestion = (tournamentId: string) => Promise.resolve(store.championSuggestion(tournamentId))

// ── Tournament teams ─────────────────────────────────────────────────────────────
export const getTournamentTeams = (tournamentId: string) => Promise.resolve(store.listTournamentTeams(tournamentId))
export const enrollTeam = (input: EnrollTeamInput) => Promise.resolve(store.enrollTeam(input))
export const removeTournamentTeam = (id: string) => Promise.resolve(store.removeTournamentTeam(id))

// ── Bracket ──────────────────────────────────────────────────────────────────
export const getBracketRounds = (tournamentId: string): Promise<BracketRound[]> => Promise.resolve(store.listBracketRounds(tournamentId))
export const createBracketRound = (input: CreateBracketRoundInput) => Promise.resolve(store.createBracketRound(input))
export const updateBracketRound = (id: string, input: UpdateBracketRoundInput) => Promise.resolve(store.updateBracketRound(id, input))
export const removeBracketRound = (id: string) => Promise.resolve(store.removeBracketRound(id))
export const getBracketSlots = (tournamentId: string): Promise<BracketSlot[]> => Promise.resolve(store.listBracketSlots(tournamentId))
export const createBracketSlot = (input: CreateBracketSlotInput) => Promise.resolve(store.createBracketSlot(input))
export const updateBracketSlot = (id: string, input: UpdateBracketSlotInput) => Promise.resolve(store.updateBracketSlot(id, input))
export const linkSlotMatch = (input: LinkSlotMatchInput) => Promise.resolve(store.linkSlotMatch(input))
export const setSlotWinner = (input: SetSlotWinnerInput) => Promise.resolve(store.setSlotWinner(input))
export const removeBracketSlot = (id: string) => Promise.resolve(store.removeBracketSlot(id))

// ── Roster ───────────────────────────────────────────────────────────────────────
export const getRoster = (tournamentId: string, teamId: string) => Promise.resolve(store.listRoster(tournamentId, teamId))
export const addRosterEntry = (input: RosterEntryInput) => Promise.resolve(store.addRosterEntry(input))
export const updateRosterEntry = (id: string, input: UpdateRosterEntryInput) => Promise.resolve(store.updateRosterEntry(id, input))
export const removeRosterEntry = (id: string) => Promise.resolve(store.removeRosterEntry(id))

// ── Athletes ─────────────────────────────────────────────────────────────────
export const getAthlete = (id: string) => Promise.resolve(getAthleteById(id))
export const getAthleteSummary = (id: string) => Promise.resolve(getAthleteSummaryById(id))
export const getAthleteMatches = (id: string) => Promise.resolve(getMockAthleteMatches(id))
export const getAthleteTournamentStats = (id: string) => Promise.resolve(getMockAthleteTournamentStats(id))

// ── Matches ────────────────────────────────────────────────────────────────────────
export const getMatches = (filter?: { tournamentId?: string }) => Promise.resolve(store.listMatches(filter))
export const getMatchDetail = (id: string) => Promise.resolve(store.getMatchDetail(id))
export const scheduleMatch = (input: ScheduleMatchInput) => Promise.resolve(store.scheduleMatch(input))
export const submitMatchResult = (input: SubmitMatchResultInput) => Promise.resolve(store.submitMatchResult(input))

// ── Groups ───────────────────────────────────────────────────────────────────
export const getGroups = (tournamentId: string) => Promise.resolve(store.listGroups(tournamentId))
export const createGroup = (input: CreateGroupInput) => Promise.resolve(store.createGroup(input))
export const getGroupTeams = (tournamentId: string) => Promise.resolve(store.listGroupTeams(tournamentId))
export const assignTeamToGroup = (input: AssignGroupTeamInput) => Promise.resolve(store.assignTeamToGroup(input))
export const removeGroupTeam = (id: string) => Promise.resolve(store.removeGroupTeam(id))

// ── Standings & tiebreaks ────────────────────────────────────────────────────
export function listStandings(tournamentId: string): Promise<StandingsEnvelope[]>
export function listStandings(tournamentId: string, groupId: string): Promise<StandingsEnvelope>
export function listStandings(tournamentId: string, groupId?: string) {
  const envelopes = store.listStandings(tournamentId, groupId)
  return Promise.resolve(groupId ? envelopes[0] : envelopes)
}
export const setTiebreakOrder = (input: SetTiebreakOrderInput) => Promise.resolve(store.setTiebreakOrder(input))
export const clearTiebreakOrder = (input: ClearTiebreakOrderInput) => Promise.resolve(store.clearTiebreakOrder(input))
