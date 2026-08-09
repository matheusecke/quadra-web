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
  getTournamentLeaders,
} from './tournaments'
export type { ListTournamentsParams } from './tournaments'

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
  linkBracketSlotMatch,
  removeBracketRound,
  removeBracketSlot,
  setBracketSlotWinner,
  unlinkBracketSlotMatch,
  updateBracketRound,
  updateBracketSlot,
} from './tournament-brackets'
export type { BracketRead } from './tournament-brackets'
export type { LinkBracketSlotMatchInput, SetBracketSlotWinnerInput } from './types'

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

// ── Team profile ─────────────────────────────────────────────────────────────
export { getTeamSummary, listTeamMatchesPage, listTeamTournamentsPage } from './team-profile'
export type { ListTeamMatchesParams, ListTeamTournamentsParams } from './team-profile'

// ── Athletes ─────────────────────────────────────────────────────────────────
export {
  getAthlete,
  getAthleteStatistics,
  listAthleteMatchesPage,
  listAthleteTournamentsPage,
} from './athletes'
export type { ListAthleteMatchesParams, ListAthleteTournamentsParams } from './athletes'

// ── Matches ────────────────────────────────────────────────────────────────────────
export {
  cancelMatch,
  createMatch,
  getMatch,
  listMatchesPage,
  listTournamentMatchesPage,
  postponeMatch,
  reopenMatch,
  saveMatchDraft,
  submitMatchResult,
  updateMatch,
} from './matches'
export type {
  CreateMatchInput,
  ListMatchesParams,
  ListTournamentMatchesParams,
  MatchPeriodInput,
  MatchPlayerStatisticInput,
  SaveMatchDraftInput,
  SubmitMatchResultInput,
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
