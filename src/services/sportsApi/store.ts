import type {
  Match,
  MatchDetail,
  PeriodScore,
  PlayerMatchStats,
  Season,
  StatLeaders,
  TeamMatchStats,
  Tournament,
  TournamentCategory,
} from '../../features/sports/types'
import { periodsSum } from '../../features/sports/statistics'
import type {
  CreateCategoryInput,
  CreateSeasonInput,
  CreateTournamentInput,
  EnrollTeamInput,
  RosterEntryInput,
  ScheduleMatchInput,
  SubmitMatchResultInput,
  UpdateSeasonInput,
  UpdateTournamentInput,
} from './types'

export interface TournamentTeam {
  id: string
  tournamentId: string
  teamId: string
  seed: number | null
  isDeleted?: boolean
}

export interface RosterEntry {
  id: string
  tournamentId: string
  teamId: string
  athleteId: string
  jerseyNumber: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  isDeleted?: boolean
}

export interface SportsStoreSeed {
  seasons: Season[]
  categories: TournamentCategory[]
  tournaments: Tournament[]
  matches: Match[]
  tournamentTeams?: TournamentTeam[]
  rosterEntries?: RosterEntry[]
  /** Optional pre-computed match details (reference box scores for seeded matches). */
  matchDetails?: MatchDetail[]
}

export interface MatchExtra {
  periodScores: PeriodScore[] | null
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
}

const emptyLeaders = (): StatLeaders => ({ ppg: [], rpg: [], apg: [], stg: [], bpg: [] })

const isActive = (record: { isDeleted?: boolean }) => record.isDeleted !== true

export function createSportsStore(seed: SportsStoreSeed) {
  const seasons: Season[] = [...seed.seasons]
  const categories: TournamentCategory[] = [...seed.categories]
  const tournaments: Tournament[] = seed.tournaments.map((t) => ({ ...t }))
  const matches: Match[] = seed.matches.map((m) => ({ ...m }))
  const tournamentTeams: TournamentTeam[] = seed.tournamentTeams?.map((entry) => ({ ...entry })) ?? []
  const rosterEntries: RosterEntry[] = seed.rosterEntries?.map((entry) => ({ ...entry })) ?? []
  const matchExtras = new Map<string, MatchExtra>()

  for (const detail of seed.matchDetails ?? []) {
    matchExtras.set(detail.id, {
      periodScores: detail.periodScores,
      homeStats: detail.homeStats,
      awayStats: detail.awayStats,
    })
  }

  const counters: Record<string, number> = {}
  const nextId = (prefix: string) => `${prefix}-${(counters[prefix] = (counters[prefix] ?? 0) + 1)}`

  const requireTournament = (id: string): Tournament => {
    const found = tournaments.find((t) => t.id === id)
    if (!found) throw new Error(`Tournament ${id} not found`)
    return found
  }

  const emptyTeamStats = (teamId: string): TeamMatchStats => ({ teamId, players: [] })

  const toBoxScore = (
    teamId: string,
    input: Exclude<SubmitMatchResultInput, { resultType: 'FORFEIT' }>,
  ): TeamMatchStats => ({
    teamId,
    players: input.playerStats.flatMap<PlayerMatchStats>((line) => {
      const rosterEntry = rosterEntries.find((entry) => entry.id === line.tournamentRosterId && isActive(entry))
      if (!rosterEntry || rosterEntry.teamId !== teamId) return []
      return [{
        tournamentRosterId: rosterEntry.id,
        athleteId: rosterEntry.athleteId,
        athleteName: rosterEntry.athleteId,
        number: rosterEntry.jerseyNumber,
        min: line.min,
        pts: line.pts,
        reb: line.reb,
        ast: line.ast,
        stl: line.stl,
        blk: line.blk,
        plusMinus: 0,
        to: line.to,
        pf: line.pf,
        fgm: line.fgm,
        fga: line.fga,
        tpm: line.tpm,
        tpa: line.tpa,
        ftm: line.ftm,
        fta: line.fta,
      }]
    }),
  })

  const isHomeSide = (match: Match, tournamentTeamId: string): boolean => {
    const tournamentTeam = tournamentTeams.find((entry) => entry.id === tournamentTeamId && isActive(entry))
    if (!tournamentTeam) throw new Error(`Tournament team ${tournamentTeamId} not found`)
    return tournamentTeam.teamId === match.homeTeamId
  }

  const bumpFinished = (match: Match) => {
    const tournament = tournaments.find((entry) => entry.id === match.tournamentId)
    if (tournament) tournament.finishedMatchCount += 1
  }

  return {
    // ── Seasons ──────────────────────────────────────────────────────────────
    listSeasons(): Season[] {
      return [...seasons]
    },
    createSeason(input: CreateSeasonInput): Season {
      const season: Season = { id: nextId('season'), label: input.label, startDate: input.startDate, endDate: input.endDate, status: 'ACTIVE' }
      seasons.push(season)
      return season
    },
    updateSeason(id: string, input: UpdateSeasonInput): Season {
      const season = seasons.find((s) => s.id === id)
      if (!season) throw new Error(`Season ${id} not found`)
      Object.assign(season, input)
      return season
    },

    // ── Categories ───────────────────────────────────────────────────────────
    listCategories(): TournamentCategory[] {
      return [...categories]
    },
    createCategory(input: CreateCategoryInput): TournamentCategory {
      const sortOrder = input.sortOrder ?? categories.reduce((max, c) => Math.max(max, c.sortOrder), 0) + 1
      const category: TournamentCategory = { id: nextId('cat'), name: input.name, sortOrder }
      categories.push(category)
      return category
    },

    // ── Tournaments ──────────────────────────────────────────────────────────
    listTournaments(): Tournament[] {
      return [...tournaments]
    },
    getTournament(id: string): Tournament | undefined {
      return tournaments.find((t) => t.id === id)
    },
    createTournament(input: CreateTournamentInput): Tournament {
      const tournament: Tournament = {
        id: nextId('tournament'),
        name: input.name,
        seasonId: input.seasonId,
        categoryId: input.categoryId,
        format: input.format,
        status: 'DRAFT',
        teamIds: [],
        matchCount: 0,
        finishedMatchCount: 0,
        startDate: input.startDate,
        endDate: input.endDate,
        updatedAt: new Date().toISOString(),
        statsStatus: 'PENDING',
        regulation: input.regulation ?? '',
        groups: [],
        leaders: emptyLeaders(),
        bracket: [],
        championTeamId: null,
      }
      tournaments.push(tournament)
      return tournament
    },
    updateTournament(id: string, input: UpdateTournamentInput): Tournament {
      const tournament = requireTournament(id)
      Object.assign(tournament, input)
      tournament.updatedAt = new Date().toISOString()
      return tournament
    },

    // ── Tournament teams (enrollment) ──────────────────────────────────────────
    listTournamentTeams(tournamentId: string): TournamentTeam[] {
      return tournamentTeams.filter((tt) => isActive(tt) && tt.tournamentId === tournamentId)
    },
    enrollTeam(input: EnrollTeamInput): TournamentTeam {
      const exists = tournamentTeams.some(
        (tt) => isActive(tt) && tt.tournamentId === input.tournamentId && tt.teamId === input.teamId,
      )
      if (exists) throw new Error('Team already enrolled in this tournament')
      const record: TournamentTeam = { id: nextId('tournament-team'), tournamentId: input.tournamentId, teamId: input.teamId, seed: input.seed ?? null }
      tournamentTeams.push(record)
      const tournament = requireTournament(input.tournamentId)
      if (!tournament.teamIds.includes(input.teamId)) tournament.teamIds = [...tournament.teamIds, input.teamId]
      return record
    },
    removeTournamentTeam(id: string): void {
      const record = tournamentTeams.find((tt) => tt.id === id)
      if (!record) return
      record.isDeleted = true
      const tournament = tournaments.find((t) => t.id === record.tournamentId)
      if (tournament) tournament.teamIds = tournament.teamIds.filter((teamId) => teamId !== record.teamId)
    },

    // ── Roster ─────────────────────────────────────────────────────────────────
    listRoster(tournamentId: string, teamId: string): RosterEntry[] {
      return rosterEntries.filter((r) => isActive(r) && r.tournamentId === tournamentId && r.teamId === teamId)
    },
    addRosterEntry(input: RosterEntryInput): RosterEntry {
      if (input.role === 'ATHLETE') {
        const conflict = rosterEntries.some(
          (r) =>
            isActive(r) &&
            r.tournamentId === input.tournamentId &&
            r.athleteId === input.athleteId &&
            r.role === 'ATHLETE' &&
            r.teamId !== input.teamId,
        )
        if (conflict) throw new Error('Athlete already on a team in the same tournament')
      }
      const record: RosterEntry = {
        id: nextId('roster'),
        tournamentId: input.tournamentId,
        teamId: input.teamId,
        athleteId: input.athleteId,
        jerseyNumber: input.jerseyNumber,
        role: input.role,
      }
      rosterEntries.push(record)
      return record
    },

    // ── Matches ────────────────────────────────────────────────────────────────
    listMatches(filter?: { tournamentId?: string }): Match[] {
      return matches.filter((m) => !filter?.tournamentId || m.tournamentId === filter.tournamentId)
    },
    getMatchDetail(id: string): MatchDetail | undefined {
      const match = matches.find((m) => m.id === id)
      if (!match) return undefined
      const extra = matchExtras.get(id)
      return {
        ...match,
        periodScores: extra?.periodScores ?? null,
        homeStats: extra?.homeStats ?? { teamId: match.homeTeamId, players: [] },
        awayStats: extra?.awayStats ?? { teamId: match.awayTeamId, players: [] },
      }
    },
    scheduleMatch(input: ScheduleMatchInput): Match {
      const match: Match = {
        id: nextId('match'),
        tournamentId: input.tournamentId,
        phase: input.phaseLabel ?? '',
        date: input.scheduledAt,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
        venue: input.venue,
        statsStatus: 'PENDING',
        homeLossType: null,
        awayLossType: null,
        scoreSource: null,
      }
      matches.push(match)
      const tournament = tournaments.find((t) => t.id === input.tournamentId)
      if (tournament) tournament.matchCount += 1
      return match
    },
    submitMatchResult(input: SubmitMatchResultInput): Match {
      const match = matches.find((m) => m.id === input.matchId)
      if (!match) throw new Error(`Match ${input.matchId} not found`)
      match.status = 'FINISHED'

      if (input.resultType === 'FORFEIT') {
        const offenderIsHome = isHomeSide(match, input.offendingTournamentTeamId)
        match.homeScore = offenderIsHome ? 0 : 20
        match.awayScore = offenderIsHome ? 20 : 0
        match.homeLossType = offenderIsHome ? 'FORFEIT' : null
        match.awayLossType = offenderIsHome ? null : 'FORFEIT'
        match.scoreSource = 'AWARDED'
        match.statsStatus = 'PENDING'
        matchExtras.set(match.id, {
          periodScores: [],
          homeStats: emptyTeamStats(match.homeTeamId),
          awayStats: emptyTeamStats(match.awayTeamId),
        })
        bumpFinished(match)
        return match
      }

      const court = periodsSum(input.periods)

      if (input.resultType === 'DEFAULT') {
        const offenderIsHome = isHomeSide(match, input.offendingTournamentTeamId)
        const offenderScore = offenderIsHome ? court.home : court.away
        const opponentScore = offenderIsHome ? court.away : court.home
        if (opponentScore > offenderScore) {
          match.homeScore = court.home
          match.awayScore = court.away
          match.scoreSource = 'PERIODS'
        } else {
          match.homeScore = offenderIsHome ? 0 : 2
          match.awayScore = offenderIsHome ? 2 : 0
          match.scoreSource = 'AWARDED'
        }
        match.homeLossType = offenderIsHome ? 'DEFAULT' : null
        match.awayLossType = offenderIsHome ? null : 'DEFAULT'
      } else {
        match.homeScore = court.home
        match.awayScore = court.away
        match.scoreSource = 'PERIODS'
        match.homeLossType = court.home < court.away ? 'NORMAL' : null
        match.awayLossType = court.away < court.home ? 'NORMAL' : null
      }

      match.statsStatus = 'COMPLETE'
      matchExtras.set(match.id, {
        periodScores: input.periods,
        homeStats: toBoxScore(match.homeTeamId, input),
        awayStats: toBoxScore(match.awayTeamId, input),
      })
      bumpFinished(match)
      return match
    },
  }
}

export type SportsStore = ReturnType<typeof createSportsStore>
