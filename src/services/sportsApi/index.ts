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
  seedSeasons,
  seedTournaments,
} from '../../features/sports/mock-sports-data'
import type { MatchDetail, StandingsEnvelope } from '../../features/sports/types'
import { createSportsStore } from './store'
import type { RosterEntry, TournamentGroup, TournamentGroupTeam, TournamentTeam } from './store'
import type {
  AssignGroupTeamInput,
  ClearTiebreakOrderInput,
  CreateCategoryInput,
  CreateGroupInput,
  CreateSeasonInput,
  CreateTournamentInput,
  EnrollTeamInput,
  RosterEntryInput,
  ScheduleMatchInput,
  SetTiebreakOrderInput,
  SubmitMatchResultInput,
  UpdateSeasonInput,
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

// ── Tournament teams ─────────────────────────────────────────────────────────────
export const getTournamentTeams = (tournamentId: string) => Promise.resolve(store.listTournamentTeams(tournamentId))
export const enrollTeam = (input: EnrollTeamInput) => Promise.resolve(store.enrollTeam(input))
export const removeTournamentTeam = (id: string) => Promise.resolve(store.removeTournamentTeam(id))

// ── Roster ───────────────────────────────────────────────────────────────────────
export const getRoster = (tournamentId: string, teamId: string) => Promise.resolve(store.listRoster(tournamentId, teamId))
export const addRosterEntry = (input: RosterEntryInput) => Promise.resolve(store.addRosterEntry(input))

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
