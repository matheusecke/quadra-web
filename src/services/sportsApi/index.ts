// SWAP SEAM: replace these bodies with axios calls to /tournaments/* when the API exists. Signatures stay.
import {
  getAthletes as getMockAthletes,
  getAthleteById,
  getAthleteMatches as getMockAthleteMatches,
  getAthleteSummaryById,
  getAthleteTournamentStats as getMockAthleteTournamentStats,
  getMatchDetailById,
  getTeams as getMockTeams,
  seedCategories,
  seedEnrollment,
  seedGroupId,
  seedGroupMembership,
  seedMatches,
  seedBracketRounds,
  seedSeasons,
  seedTournaments,
} from '../../features/sports/mock-sports-data'
import { SEED_TOURNAMENT, seedRosterId, tournamentTeamId } from '../../features/sports/seedIds'
import type {
  BracketRound,
  BracketSlot,
  MatchDetail,
  RosterEntry,
  StandingsEnvelope,
  TournamentGroup,
  TournamentGroupTeam,
  TournamentTeam,
} from '../../features/sports/types'
import { createSportsStore } from './store'
import type {
  AssignGroupTeamInput,
  ClearTiebreakOrderInput,
  CompleteTournamentInput,
  CreateBracketRoundInput,
  CreateBracketSlotInput,
  CreateCategoryInput,
  CreateGroupInput,
  CreateTournamentInput,
  EnrollTeamInput,
  LinkSlotMatchInput,
  RosterEntryInput,
  ReopenTournamentInput,
  ScheduleMatchInput,
  SetTiebreakOrderInput,
  SetSlotWinnerInput,
  SubmitMatchResultInput,
  UpdateBracketRoundInput,
  UpdateBracketSlotInput,
  UpdateRosterEntryInput,
  UpdateTournamentInput,
} from './types'

const seedMatchDetails = seedMatches
  .map((match) => getMatchDetailById(match.id))
  .filter((detail): detail is MatchDetail => Boolean(detail))

const teamNameById = new Map(getMockTeams().map((team) => [team.id, team.name]))

const seedTournamentTeams: TournamentTeam[] = seedEnrollment.flatMap((enrollment) =>
  enrollment.teamIds.map((teamId) => ({
    id: tournamentTeamId(enrollment.tournamentId, teamId),
    tournamentId: enrollment.tournamentId,
    teamId,
    displayNameSnapshot: teamNameById.get(teamId) ?? String(teamId),
    seed: null,
    tiebreakOrder: null,
    tiebreakBlockKey: null,
  })),
)

const seedBracketRoundRows: BracketRound[] = seedBracketRounds.map((round, roundIndex) => ({
  id: roundIndex + 1,
  tournamentId: SEED_TOURNAMENT.GERAL,
  number: roundIndex + 1,
  label: round.name,
}))

const seedInvernoBracketRounds: BracketRound[] = [
  { id: seedBracketRoundRows.length + 1, tournamentId: SEED_TOURNAMENT.INVERNO, number: 1, label: 'Semifinais' },
  { id: seedBracketRoundRows.length + 2, tournamentId: SEED_TOURNAMENT.INVERNO, number: 2, label: 'Final' },
]

let nextBracketSlotId = 5000

const seedBracketSlots: BracketSlot[] = seedBracketRounds.flatMap((round, roundIndex) =>
  round.matches.map((slot, position) => ({
    id: ++nextBracketSlotId,
    tournamentId: SEED_TOURNAMENT.GERAL,
    roundId: seedBracketRoundRows[roundIndex].id,
    position: position + 1,
    label: null,
    homeTournamentTeamId: slot.homeTeamId ? tournamentTeamId(SEED_TOURNAMENT.GERAL, slot.homeTeamId) : null,
    awayTournamentTeamId: slot.awayTeamId ? tournamentTeamId(SEED_TOURNAMENT.GERAL, slot.awayTeamId) : null,
    matchId: slot.matchId,
    winnerTournamentTeamId: slot.winnerId ? tournamentTeamId(SEED_TOURNAMENT.GERAL, slot.winnerId) : null,
  })),
)

const seedInvernoBracketSlots: BracketSlot[] = [
  { id: ++nextBracketSlotId, tournamentId: SEED_TOURNAMENT.INVERNO, roundId: seedInvernoBracketRounds[0].id, position: 1, label: null, homeTournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 1), awayTournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 4), matchId: 213, winnerTournamentTeamId: null },
  { id: ++nextBracketSlotId, tournamentId: SEED_TOURNAMENT.INVERNO, roundId: seedInvernoBracketRounds[0].id, position: 2, label: null, homeTournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 5), awayTournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 8), matchId: 214, winnerTournamentTeamId: null },
  { id: ++nextBracketSlotId, tournamentId: SEED_TOURNAMENT.INVERNO, roundId: seedInvernoBracketRounds[1].id, position: 1, label: null, homeTournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 1), awayTournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.INVERNO, 5), matchId: 215, winnerTournamentTeamId: null },
]

const seedRosterEntries: RosterEntry[] = seedTournamentTeams.flatMap((tournamentTeam) =>
  getMockAthletes()
    .filter((athlete) => athlete.currentTeamId === tournamentTeam.teamId)
    .map((athlete) => ({
      id: seedRosterId(tournamentTeam.tournamentId, athlete.id),
      tournamentId: tournamentTeam.tournamentId,
      tournamentTeamId: tournamentTeam.id,
      athleteId: athlete.id,
      jerseyNumber: athlete.number,
      role: 'ATHLETE' as const,
    })),
)

/** Same numeric id `seedGroupId` derives for the mock's group-stage matches — the two sides
 *  agree without a lookup table. */
const seedTournamentGroups: TournamentGroup[] = seedGroupMembership.map((g) => ({
  id: seedGroupId(g.tournamentId, g.groupName),
  tournamentId: g.tournamentId,
  name: g.groupName,
  sortOrder: g.groupName.charCodeAt(g.groupName.length - 1),
}))

let nextGroupTeamId = 3000

const seedTournamentGroupTeams: TournamentGroupTeam[] = seedGroupMembership.flatMap((g) =>
  g.teamIds.map((teamId) => ({
    id: ++nextGroupTeamId,
    tournamentId: g.tournamentId,
    groupId: seedGroupId(g.tournamentId, g.groupName),
    tournamentTeamId: tournamentTeamId(g.tournamentId, teamId),
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
export { getSeasons, listSeasonsPage, createSeason } from './seasons'
export type { ListSeasonsParams } from './seasons'

// ── Categories ─────────────────────────────────────────────────────────────────
export const getCategories = () => Promise.resolve(store.listCategories())
export const createCategory = (input: CreateCategoryInput) => Promise.resolve(store.createCategory(input))

// ── Tournaments ──────────────────────────────────────────────────────────────────
export const getTournaments = () => Promise.resolve(store.listTournaments())
export const getTournament = (id: number) => Promise.resolve(store.getTournament(id))
export const createTournament = (input: CreateTournamentInput) => Promise.resolve(store.createTournament(input))
export const updateTournament = (id: number, input: UpdateTournamentInput) => Promise.resolve(store.updateTournament(id, input))
export const completeTournament = (input: CompleteTournamentInput) => Promise.resolve(store.completeTournament(input))
export const reopenTournament = (input: ReopenTournamentInput) => Promise.resolve(store.reopenTournament(input))
export const getChampionSuggestion = (tournamentId: number) => Promise.resolve(store.championSuggestion(tournamentId))

// ── Tournament teams ─────────────────────────────────────────────────────────────
export const getTournamentTeams = (tournamentId: number) => Promise.resolve(store.listTournamentTeams(tournamentId))
export const getAllTournamentTeams = () => Promise.resolve(store.listAllTournamentTeams())
export const enrollTeam = (input: EnrollTeamInput) => Promise.resolve(store.enrollTeam(input))
export const removeTournamentTeam = (id: number) => Promise.resolve(store.removeTournamentTeam(id))

// ── Bracket ──────────────────────────────────────────────────────────────────
export const getBracketRounds = (tournamentId: number): Promise<BracketRound[]> => Promise.resolve(store.listBracketRounds(tournamentId))
export const createBracketRound = (input: CreateBracketRoundInput) => Promise.resolve(store.createBracketRound(input))
export const updateBracketRound = (id: number, input: UpdateBracketRoundInput) => Promise.resolve(store.updateBracketRound(id, input))
export const removeBracketRound = (id: number) => Promise.resolve(store.removeBracketRound(id))
export const getBracketSlots = (tournamentId: number): Promise<BracketSlot[]> => Promise.resolve(store.listBracketSlots(tournamentId))
export const createBracketSlot = (input: CreateBracketSlotInput) => Promise.resolve(store.createBracketSlot(input))
export const updateBracketSlot = (id: number, input: UpdateBracketSlotInput) => Promise.resolve(store.updateBracketSlot(id, input))
export const linkSlotMatch = (input: LinkSlotMatchInput) => Promise.resolve(store.linkSlotMatch(input))
export const setSlotWinner = (input: SetSlotWinnerInput) => Promise.resolve(store.setSlotWinner(input))
export const removeBracketSlot = (id: number) => Promise.resolve(store.removeBracketSlot(id))

// ── Roster ───────────────────────────────────────────────────────────────────────
export const getRoster = (tournamentId: number, tournamentTeamId: number) => Promise.resolve(store.listRoster(tournamentId, tournamentTeamId))
export const addRosterEntry = (input: RosterEntryInput) => Promise.resolve(store.addRosterEntry(input))
export const updateRosterEntry = (id: number, input: UpdateRosterEntryInput) => Promise.resolve(store.updateRosterEntry(id, input))
export const removeRosterEntry = (id: number) => Promise.resolve(store.removeRosterEntry(id))

// ── Teams ────────────────────────────────────────────────────────────────────
export const getTeams = () => Promise.resolve(getMockTeams())

// ── Athletes ─────────────────────────────────────────────────────────────────
export const getAthletes = () => Promise.resolve(getMockAthletes())
export const getAthlete = (id: number) => Promise.resolve(getAthleteById(id))
export const getAthleteSummary = (id: number) => Promise.resolve(getAthleteSummaryById(id))
export const getAthleteMatches = (id: number) => Promise.resolve(getMockAthleteMatches(id))
export const getAthleteTournamentStats = (id: number) => Promise.resolve(getMockAthleteTournamentStats(id))

// ── Matches ────────────────────────────────────────────────────────────────────────
export const getMatches = (filter?: { tournamentId?: number }) => Promise.resolve(store.listMatches(filter))
export const getMatchDetail = (id: number) => Promise.resolve(store.getMatchDetail(id))
export const scheduleMatch = (input: ScheduleMatchInput) => Promise.resolve(store.scheduleMatch(input))
export const submitMatchResult = (input: SubmitMatchResultInput) => Promise.resolve(store.submitMatchResult(input))

// ── Groups ───────────────────────────────────────────────────────────────────
export const getGroups = (tournamentId: number) => Promise.resolve(store.listGroups(tournamentId))
export const createGroup = (input: CreateGroupInput) => Promise.resolve(store.createGroup(input))
export const getGroupTeams = (tournamentId: number) => Promise.resolve(store.listGroupTeams(tournamentId))
export const assignTeamToGroup = (input: AssignGroupTeamInput) => Promise.resolve(store.assignTeamToGroup(input))
export const removeGroupTeam = (id: number) => Promise.resolve(store.removeGroupTeam(id))

// ── Standings & tiebreaks ────────────────────────────────────────────────────
export function listStandings(tournamentId: number): Promise<StandingsEnvelope[]>
export function listStandings(tournamentId: number, groupId: number): Promise<StandingsEnvelope>
export function listStandings(tournamentId: number, groupId?: number) {
  const envelopes = store.listStandings(tournamentId, groupId)
  return Promise.resolve(groupId ? envelopes[0] : envelopes)
}
export const setTiebreakOrder = (input: SetTiebreakOrderInput) => Promise.resolve(store.setTiebreakOrder(input))
export const clearTiebreakOrder = (input: ClearTiebreakOrderInput) => Promise.resolve(store.clearTiebreakOrder(input))
