/**
 * Sports domain — MOCK DATA (PUC Campinas Basquete demo).
 * Numeric IDs follow docs/superpowers/plans/2026-07-22-sports-numeric-ids.md
 * (Team N = puc-time-N; Athlete 101+index; Tournament 1=Geral, 2=Inverno, 3=fixtures).
 * Team/athlete display names still trace quadra-api/prisma/seeds/puc-dev-seed.sql.
 */
import type { MatchStatus, Team, Tournament } from './types'
import { SEED_TOURNAMENT, tournamentTeamId } from './seedIds'

export const MOCK_TEAMS: Team[] = [
  { id: 1, name: 'Time 1', shortName: 'T01', city: 'Campinas' },
  { id: 2, name: 'Time 2', shortName: 'T02', city: 'Campinas' },
  { id: 3, name: 'Time 3', shortName: 'T03', city: 'Campinas' },
  { id: 4, name: 'Time 4', shortName: 'T04', city: 'Campinas' },
  { id: 5, name: 'Time 5', shortName: 'T05', city: 'Campinas' },
  { id: 6, name: 'Time 6', shortName: 'T06', city: 'Campinas' },
  { id: 7, name: 'Time 7', shortName: 'T07', city: 'Campinas' },
  { id: 8, name: 'Time 8', shortName: 'T08', city: 'Campinas' },
  { id: 9, name: 'Time 9', shortName: 'T09', city: 'Campinas' },
  { id: 10, name: 'Time 10', shortName: 'T10', city: 'Campinas' },
  { id: 11, name: 'Time 11', shortName: 'T11', city: 'Campinas' },
  { id: 12, name: 'Time 12', shortName: 'T12', city: 'Campinas' },
  { id: 13, name: 'Time 13', shortName: 'T13', city: 'Campinas' },
  { id: 14, name: 'Time 14', shortName: 'T14', city: 'Campinas' },
  { id: 15, name: 'Time 15', shortName: 'T15', city: 'Campinas' },
  { id: 16, name: 'Time 16', shortName: 'T16', city: 'Campinas' },
]

/** Shape of the historical fixture builders below — mirrors the retired store-era `Match`
 *  record. Private on purpose: adapters/queries must never accept this shape. */
interface MockMatchFixture {
  id: number
  tournamentId: number
  date: string
  homeTournamentTeamId: number
  awayTournamentTeamId: number
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  venue?: string
  tournamentGroupId: number | null
  bracketRound: { id: number; number: number; label: string | null } | null
  homeLossType: 'NORMAL' | 'DEFAULT' | 'FORFEIT' | null
  awayLossType: 'NORMAL' | 'DEFAULT' | 'FORFEIT' | null
  scoreSource: 'PERIODS' | 'AWARDED' | null
}

let matchSeq=9000
function mkMatch(tournamentId:number,date:string,homeTeamId:number,awayTeamId:number,home:number|null,away:number|null,status:MockMatchFixture['status'],venue:string,id?:number):MockMatchFixture{const isFinished=status==='FINISHED';return{id:id??++matchSeq,tournamentId,date,homeTournamentTeamId:tournamentTeamId(tournamentId,homeTeamId),awayTournamentTeamId:tournamentTeamId(tournamentId,awayTeamId),homeScore:home,awayScore:away,status,venue,tournamentGroupId:null,bracketRound:null,homeLossType:isFinished&&home!==null&&away!==null&&home<away?'NORMAL':null,awayLossType:isFinished&&home!==null&&away!==null&&away<home?'NORMAL':null,scoreSource:isFinished?'PERIODS':null}}
const REGULATION='Fase classificatória em grupos. As melhores equipes avançam para playoffs em mata-mata. Desempate: vitórias, saldo de pontos, confronto direto.'
const GERAL = SEED_TOURNAMENT.GERAL; const INVERNO = SEED_TOURNAMENT.INVERNO

const geralMatches: MockMatchFixture[] = [
  mkMatch(GERAL, '2026-03-07T19:00:00', 1, 2, 80, 89, 'FINISHED', 'Ginásio PUC Campinas', 101),
  mkMatch(GERAL, '2026-03-14T19:00:00', 1, 3, 87, 83, 'FINISHED', 'Ginásio PUC Campinas', 102),
  mkMatch(GERAL, '2026-03-21T19:00:00', 1, 4, 94, 77, 'FINISHED', 'Ginásio PUC Campinas', 103),
  mkMatch(GERAL, '2026-03-28T19:00:00', 2, 3, 79, 83, 'FINISHED', 'Ginásio PUC Campinas', 104),
  mkMatch(GERAL, '2026-04-04T19:00:00', 2, 4, 86, 77, 'FINISHED', 'Ginásio PUC Campinas', 105),
  mkMatch(GERAL, '2026-04-11T19:00:00', 3, 4, 91, 88, 'FINISHED', 'Ginásio PUC Campinas', 106),
  mkMatch(GERAL, '2026-03-07T19:00:00', 6, 5, 87, 91, 'FINISHED', 'Arena Central PUC', 107),
  mkMatch(GERAL, '2026-03-14T19:00:00', 6, 7, 94, 81, 'FINISHED', 'Arena Central PUC', 108),
  mkMatch(GERAL, '2026-03-21T19:00:00', 6, 8, 76, 75, 'FINISHED', 'Arena Central PUC', 109),
  mkMatch(GERAL, '2026-03-28T19:00:00', 5, 7, 80, 81, 'FINISHED', 'Arena Central PUC', 110),
  mkMatch(GERAL, '2026-04-04T19:00:00', 5, 8, 87, 75, 'FINISHED', 'Arena Central PUC', 111),
  mkMatch(GERAL, '2026-04-11T19:00:00', 7, 8, 90, 86, 'FINISHED', 'Arena Central PUC', 112),
  mkMatch(GERAL, '2026-03-07T19:00:00', 9, 10, 88, 90, 'FINISHED', 'Ginásio PUC Campinas', 113),
  mkMatch(GERAL, '2026-03-14T19:00:00', 9, 11, 70, 79, 'FINISHED', 'Ginásio PUC Campinas', 114),
  mkMatch(GERAL, '2026-03-21T19:00:00', 9, 12, 77, 73, 'FINISHED', 'Ginásio PUC Campinas', 115),
  mkMatch(GERAL, '2026-03-28T19:00:00', 10, 11, 87, 88, 'FINISHED', 'Ginásio PUC Campinas', 116),
  mkMatch(GERAL, '2026-04-04T19:00:00', 10, 12, 94, 73, 'FINISHED', 'Ginásio PUC Campinas', 117),
  mkMatch(GERAL, '2026-04-11T19:00:00', 11, 12, 89, 84, 'FINISHED', 'Ginásio PUC Campinas', 118),
  mkMatch(GERAL, '2026-03-07T19:00:00', 13, 14, 92, 96, 'FINISHED', 'Arena Central PUC', 119),
  mkMatch(GERAL, '2026-03-14T19:00:00', 13, 15, 74, 77, 'FINISHED', 'Arena Central PUC', 120),
  mkMatch(GERAL, '2026-03-21T19:00:00', 13, 16, 81, 71, 'FINISHED', 'Arena Central PUC', 121),
  mkMatch(GERAL, '2026-03-28T19:00:00', 14, 15, 91, 94, 'FINISHED', 'Arena Central PUC', 122),
  mkMatch(GERAL, '2026-04-04T19:00:00', 14, 16, 73, 71, 'FINISHED', 'Arena Central PUC', 123),
  mkMatch(GERAL, '2026-04-11T19:00:00', 15, 16, 83, 82, 'FINISHED', 'Arena Central PUC', 124),
  mkMatch(GERAL, '2026-05-10T19:00:00', 1, 5, 86, 82, 'FINISHED', 'Ginásio PUC Campinas', 125),
  mkMatch(GERAL, '2026-05-10T21:00:00', 6, 2, 70, 78, 'FINISHED', 'Ginásio PUC Campinas', 126),
  mkMatch(GERAL, '2026-05-11T19:00:00', 9, 14, 86, 83, 'FINISHED', 'Ginásio PUC Campinas', 127),
  mkMatch(GERAL, '2026-05-11T21:00:00', 13, 10, 84, 81, 'FINISHED', 'Ginásio PUC Campinas', 128),
  mkMatch(GERAL, '2026-05-24T19:00:00', 1, 13, 82, 78, 'FINISHED', 'Ginásio PUC Campinas', 129),
  mkMatch(GERAL, '2026-05-24T21:00:00', 2, 9, 86, 69, 'FINISHED', 'Ginásio PUC Campinas', 130),
  mkMatch(GERAL, '2026-05-31T20:00:00', 1, 2, 84, 80, 'FINISHED', 'Ginásio PUC Campinas', 131),
]
/** Raw global-team roster per seed tournament — the source `services/sportsApi/index.ts` uses
 *  to build `seedTournamentTeams`, and `enrolledTeamCount` below is derived from. */
export const seedEnrollment = [
  { tournamentId: GERAL, teamIds: MOCK_TEAMS.map((t) => t.id) },
  { tournamentId: INVERNO, teamIds: [1, 2, 3, 4, 5, 6, 7, 8] },
]

/** Reverses tournamentTeamId → the raw global team id, via the enrollment table rather than
 *  arithmetic on the synthetic id — keeps this file's reasoning independent of seedIds.ts's formula. */
const teamIdOfEnrollment = (tournamentId: number, tournamentTeamIdValue: number): number | undefined =>
  seedEnrollment
    .find((e) => e.tournamentId === tournamentId)
    ?.teamIds.find((id) => tournamentTeamId(tournamentId, id) === tournamentTeamIdValue)

export const seedBracketRounds = [{ name:'Quartas de final',matches:[{id:'geral-qf1',matchId:125,homeTeamId:1,awayTeamId:5,winnerId:1},{id:'geral-qf4',matchId:128,homeTeamId:13,awayTeamId:10,winnerId:13},{id:'geral-qf2',matchId:126,homeTeamId:6,awayTeamId:2,winnerId:2},{id:'geral-qf3',matchId:127,homeTeamId:9,awayTeamId:14,winnerId:9}]},{name:'Semifinais',matches:[{id:'geral-sf1',matchId:129,homeTeamId:1,awayTeamId:13,winnerId:1},{id:'geral-sf2',matchId:130,homeTeamId:2,awayTeamId:9,winnerId:2}]},{name:'Final',matches:[{id:'geral-f1',matchId:131,homeTeamId:1,awayTeamId:2,winnerId:1}]}]
const geralTournament: Tournament = { id: GERAL, name: 'Campeonato Geral da PUC 2026', seasonId: 1, categoryId: 2, regulation: REGULATION, format: 'GROUP_STAGE_KNOCKOUT', status: 'COMPLETED', startsAt: '2026-03-01T00:00:00.000Z', endsAt: '2026-05-31T00:00:00.000Z', registrationStartsAt: null, registrationEndsAt: null, isRegistrationOpen: false, championTournamentTeamId: tournamentTeamId(GERAL, 1), enrolledTeamCount: seedEnrollment[0].teamIds.length, matchCount: 31, finishedMatchCount: 31, updatedAt: '2026-05-31T22:00:00.000Z' }
const invernoMatches: MockMatchFixture[] = [
  mkMatch(INVERNO, '2026-07-03T19:00:00', 1, 2, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 201),
  mkMatch(INVERNO, '2026-07-05T19:00:00', 1, 3, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 202),
  mkMatch(INVERNO, '2026-07-07T19:00:00', 1, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 203),
  mkMatch(INVERNO, '2026-07-09T19:00:00', 2, 3, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 204),
  mkMatch(INVERNO, '2026-07-11T19:00:00', 2, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 205),
  mkMatch(INVERNO, '2026-07-13T19:00:00', 3, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 206),
  mkMatch(INVERNO, '2026-07-15T19:00:00', 5, 6, null, null, 'SCHEDULED', 'Arena Central PUC', 207),
  mkMatch(INVERNO, '2026-07-17T19:00:00', 5, 7, null, null, 'SCHEDULED', 'Arena Central PUC', 208),
  mkMatch(INVERNO, '2026-07-19T19:00:00', 5, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 209),
  mkMatch(INVERNO, '2026-07-21T19:00:00', 6, 7, null, null, 'SCHEDULED', 'Arena Central PUC', 210),
  mkMatch(INVERNO, '2026-07-23T19:00:00', 6, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 211),
  mkMatch(INVERNO, '2026-07-25T19:00:00', 7, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 212),
  mkMatch(INVERNO, '2026-07-25T19:00:00', 1, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 213),
  mkMatch(INVERNO, '2026-07-25T21:00:00', 5, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 214),
  mkMatch(INVERNO, '2026-07-31T20:00:00', 1, 5, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 215),
]
const invernoTournament: Tournament = { id: INVERNO, name: 'Copa de Inverno PUC', seasonId: 1, categoryId: 2, regulation: REGULATION, format: 'GROUP_STAGE_KNOCKOUT', status: 'REGISTRATION', startsAt: '2026-07-01T00:00:00.000Z', endsAt: '2026-07-31T00:00:00.000Z', registrationStartsAt: null, registrationEndsAt: null, isRegistrationOpen: false, championTournamentTeamId: null, enrolledTeamCount: seedEnrollment[1].teamIds.length, matchCount: 16, finishedMatchCount: 0, updatedAt: '2026-07-01T10:00:00.000Z' }
export const seedTournaments: Tournament[] = [geralTournament, invernoTournament]

/** Group membership of the demo tournaments, seeded into the store (UI spec §7.4). The
 *  classification itself is not seeded: it is derived from the matches, which already exist. */
export const seedGroupMembership = [
  { tournamentId: GERAL, groupName: 'Grupo A', teamIds: [1, 2, 3, 4] },
  { tournamentId: GERAL, groupName: 'Grupo B', teamIds: [5, 6, 7, 8] },
  { tournamentId: GERAL, groupName: 'Grupo C', teamIds: [9, 10, 11, 12] },
  { tournamentId: GERAL, groupName: 'Grupo D', teamIds: [13, 14, 15, 16] },
  { tournamentId: INVERNO, groupName: 'Grupo A', teamIds: [1, 2, 3, 4] },
  { tournamentId: INVERNO, groupName: 'Grupo B', teamIds: [5, 6, 7, 8] },
]

const seedGroupNameOf = (tournamentId: number, teamId: number): string | null =>
  seedGroupMembership.find((g) => g.tournamentId === tournamentId && g.teamIds.includes(teamId))?.groupName ?? null

/** Stable numeric group ids: Geral A–D → 1–4; Inverno A–B → 5–6. Shared with
 *  `sportsApi/index.ts` so seeded matches and seeded TournamentGroup rows agree. */
const GROUP_IDS: Record<string, number> = {
  '1:Grupo A': 1, '1:Grupo B': 2, '1:Grupo C': 3, '1:Grupo D': 4,
  '2:Grupo A': 5, '2:Grupo B': 6,
}
export function seedGroupId(tournamentId: number, groupName: string): number {
  const id = GROUP_IDS[`${tournamentId}:${groupName}`]
  if (id === undefined) throw new Error(`No seed group id for tournament ${tournamentId} / ${groupName}`)
  return id
}

/** Knockout match ids — bracket games must not get a group id even when both sides share a group
 *  (Inverno's semifinals do). Geral knockout ids come from seedBracketRounds. */
const seedKnockoutMatchIds = new Set([
  ...seedBracketRounds.flatMap((round) => round.matches.map((slot) => slot.matchId)),
  213,
  214,
  215,
])

/** A match belongs to a group only when it is a group-stage game between two teams of the same
 *  group. Knockout ids exclude bracket games. */
const seedGroupIdOf = (match: MockMatchFixture): number | null => {
  if (seedKnockoutMatchIds.has(match.id)) return null
  const homeTeamId = teamIdOfEnrollment(match.tournamentId, match.homeTournamentTeamId)
  const awayTeamId = teamIdOfEnrollment(match.tournamentId, match.awayTournamentTeamId)
  if (homeTeamId === undefined || awayTeamId === undefined) return null
  const home = seedGroupNameOf(match.tournamentId, homeTeamId)
  const away = seedGroupNameOf(match.tournamentId, awayTeamId)
  return home && home === away ? seedGroupId(match.tournamentId, home) : null
}
// Stable scheduled match used to demo/record a súmula (two teams with rostered athletes).
const sumulaSeedMatch = mkMatch(INVERNO, '2026-07-04T19:00:00', 1, 2, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 216)
const abandonedSeedMatch = mkMatch(3, '2026-07-05T19:00:00', 3, 4, 2, 0, 'FINISHED', 'Ginásio PUC Campinas', 217)
abandonedSeedMatch.awayLossType = 'DEFAULT'
abandonedSeedMatch.scoreSource = 'AWARDED'
const forfeitSeedMatch = mkMatch(3, '2026-07-06T19:00:00', 3, 4, 20, 0, 'FINISHED', 'Ginásio PUC Campinas', 218)
forfeitSeedMatch.awayLossType = 'FORFEIT'
forfeitSeedMatch.scoreSource = 'AWARDED'
export const seedMatches: MockMatchFixture[] = [...geralMatches, ...invernoMatches, sumulaSeedMatch, abandonedSeedMatch, forfeitSeedMatch]
  .map((match) => ({
    ...match,
    tournamentGroupId: seedGroupIdOf(match),
  }))
const MOCK_TOURNAMENTS = seedTournaments
const MOCK_MATCHES = seedMatches

export function getTeams(): Team[] { return MOCK_TEAMS }
export function getTournaments(): Tournament[] { return MOCK_TOURNAMENTS }
export function getTournamentById(id: number): Tournament | undefined { return MOCK_TOURNAMENTS.find((c) => c.id === id) }
export function getMatchesByTournament(tournamentId: number): MockMatchFixture[] { return MOCK_MATCHES.filter((m) => m.tournamentId === tournamentId) }
export function getAllMatches(): MockMatchFixture[] { return MOCK_MATCHES }
