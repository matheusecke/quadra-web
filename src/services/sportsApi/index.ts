import {
  getAthletes as getMockAthletes,
  getAthleteById,
  getAthleteMatches as getMockAthleteMatches,
  getAthleteSummaryById,
  getAthleteTournamentStats as getMockAthleteTournamentStats,
  getTournamentLeaders as getMockTournamentLeaders,
} from '../../features/sports/mock-sports-data'

// ── Seasons ──────────────────────────────────────────────────────────────────
export { getSeasons, listSeasonsPage, createSeason } from './seasons'
export type { ListSeasonsParams } from './seasons'

// ── Categories ─────────────────────────────────────────────────────────────────
export { getCategories, listCategoriesPage, createCategory } from './categories'
export type { ListCategoriesParams } from './categories'

// ── Tournaments ──────────────────────────────────────────────────────────────────
export {
  getTournaments,
  listTournamentsPage,
  getTournament,
  createTournament,
  updateTournament,
  completeTournament,
  reopenTournament,
  getChampionSuggestion,
} from './tournaments'
export type { ListTournamentsParams } from './tournaments'

// ── Tournament leaders (mock até a fase 10: GET /tournaments/:id/leaders) ─────────
export const getTournamentLeaders = (tournamentId: number) =>
  Promise.resolve(getMockTournamentLeaders(tournamentId))

// ── Tournament teams ─────────────────────────────────────────────────────────────
export {
  enrollTeam,
  getAllTournamentTeams,
  getTournamentTeams,
  listTournamentTeamsPage,
  removeTournamentTeam,
  updateTournamentTeam,
} from './tournament-teams'
export type { ListTournamentTeamsParams } from './tournament-teams'

// ── Bracket ──────────────────────────────────────────────────────────────────
export {
  createBracketRound,
  createBracketSlot,
  getBracket,
  removeBracketRound,
  removeBracketSlot,
  updateBracketRound,
  updateBracketSlot,
} from './tournament-brackets'
export type { BracketRead } from './tournament-brackets'

// ── Roster ───────────────────────────────────────────────────────────────────────
export {
  addTournamentRoster,
  getTournamentRoster,
  removeTournamentRoster,
  updateTournamentRoster,
} from './tournament-rosters'

// ── Teams ────────────────────────────────────────────────────────────────────
export { getTeams, listTeamsPage, listRosterCandidatesPage, searchRosterCandidates, searchTeams } from './catalogs'
export type { ListRosterCandidatesParams, ListTeamsParams } from './catalogs'

// ── Athletes ─────────────────────────────────────────────────────────────────
export const getAthletes = () => Promise.resolve(getMockAthletes())
export const getAthlete = (id: number) => Promise.resolve(getAthleteById(id))
export const getAthleteSummary = (id: number) => Promise.resolve(getAthleteSummaryById(id))
export const getAthleteMatches = (id: number) => Promise.resolve(getMockAthleteMatches(id))
export const getAthleteTournamentStats = (id: number) => Promise.resolve(getMockAthleteTournamentStats(id))

// ── Matches ────────────────────────────────────────────────────────────────────────
export {
  cancelMatch,
  createMatch,
  getMatch,
  listMatchesPage,
  listTournamentMatchesPage,
  postponeMatch,
  updateMatch,
} from './matches'
export type {
  CreateMatchInput,
  ListMatchesParams,
  ListTournamentMatchesParams,
  UpdateMatchInput,
} from './matches'

// ── Groups ───────────────────────────────────────────────────────────────────
export {
  assignTeamToGroup,
  createGroup,
  getGroupTeams,
  getGroups,
  removeGroup,
  removeGroupTeam,
  updateGroup,
} from './tournament-groups'

// ── Standings & tiebreaks ────────────────────────────────────────────────────
export { clearTiebreakOrder, listStandings, setTiebreakOrder } from './standings'
