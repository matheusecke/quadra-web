import type {
  Match,
  MatchDetail,
  MatchMvp,
  PeriodScore,
  PlayerMatchStats,
  Season,
  StandingsEnvelope,
  StatLeaders,
  TeamMatchStats,
  Tournament,
  TournamentCategory,
} from '../../features/sports/types'
import { periodsSum } from '../../features/sports/statistics'
import { computeStandings } from './standings'
import type { StandingTeamInput } from './standings'
import type {
  AssignGroupTeamInput,
  ClearTiebreakOrderInput,
  CompleteTournamentInput,
  CreateCategoryInput,
  CreateBracketSlotInput,
  CreateGroupInput,
  CreateSeasonInput,
  CreateTournamentInput,
  EnrollTeamInput,
  LinkSlotMatchInput,
  RosterEntryInput,
  ReopenTournamentInput,
  ScheduleMatchInput,
  PlayerBoxScoreInput,
  SetTiebreakOrderInput,
  SetSlotWinnerInput,
  SubmitMatchResultInput,
  UpdateSeasonInput,
  UpdateBracketSlotInput,
  UpdateRosterEntryInput,
  UpdateTournamentInput,
} from './types'

export interface TournamentTeam {
  id: string
  tournamentId: string
  teamId: string
  /** The team's name at enrollment. Survives a later rename (DB spec §5.3). */
  displayNameSnapshot: string
  seed: number | null
  /** The recorded draw (FIBA's last criterion) and the block it was recorded for. §8.8 */
  tiebreakOrder: number | null
  tiebreakBlockKey: string | null
  isDeleted?: boolean
}

export interface TournamentGroup {
  id: string
  tournamentId: string
  name: string
  sortOrder: number
  isDeleted?: boolean
}

export interface TournamentGroupTeam {
  id: string
  tournamentId: string
  groupId: string
  teamId: string
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

export interface BracketRound {
  id: string
  tournamentId: string
  /** 1 = primeira rodada do mata-mata. Ordenação, não contagem. */
  number: number
  /** 'Quartas de final', 'Semifinais', 'Final'. Livre, escrito pelo admin. */
  label: string | null
  isDeleted?: boolean
}

export interface BracketSlot {
  id: string
  tournamentId: string
  roundNumber: number
  position: number
  label: string | null
  homeTournamentTeamId: string | null
  awayTournamentTeamId: string | null
  matchId: string | null
  winnerTournamentTeamId: string | null
  isDeleted?: boolean
}

export interface SportsStoreSeed {
  seasons: Season[]
  categories: TournamentCategory[]
  tournaments: Tournament[]
  matches: Match[]
  tournamentTeams?: TournamentTeam[]
  rosterEntries?: RosterEntry[]
  tournamentGroups?: TournamentGroup[]
  tournamentGroupTeams?: TournamentGroupTeam[]
  bracketSlots?: BracketSlot[]
  /** Optional pre-computed match details (reference box scores for seeded matches). */
  matchDetails?: MatchDetail[]
}

export interface MatchExtra {
  periodScores: PeriodScore[] | null
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
  mvp: MatchMvp | null
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
  const tournamentGroups: TournamentGroup[] = seed.tournamentGroups?.map((g) => ({ ...g })) ?? []
  const tournamentGroupTeams: TournamentGroupTeam[] = seed.tournamentGroupTeams?.map((g) => ({ ...g })) ?? []
  const bracketSlots: BracketSlot[] = seed.bracketSlots?.map((slot) => ({ ...slot })) ?? []
  const matchExtras = new Map<string, MatchExtra>()

  for (const detail of seed.matchDetails ?? []) {
    matchExtras.set(detail.id, {
      periodScores: detail.periodScores,
      homeStats: detail.homeStats,
      awayStats: detail.awayStats,
      mvp: detail.mvp,
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

  const resolveMvp = (
    mvpTournamentRosterId: string | null | undefined,
    playerStats: PlayerBoxScoreInput[],
  ): MatchMvp | null => {
    if (!mvpTournamentRosterId) return null
    const line = playerStats.find((stat) => stat.tournamentRosterId === mvpTournamentRosterId)
    const rosterEntry = rosterEntries.find((entry) => entry.id === mvpTournamentRosterId && isActive(entry))
    if (!line || !rosterEntry || rosterEntry.role !== 'ATHLETE') {
      throw new Error('MVP must be one of the players in the box score')
    }
    return { tournamentRosterId: rosterEntry.id, athleteId: rosterEntry.athleteId }
  }

  const isHomeSide = (match: Match, tournamentTeamId: string): boolean => {
    const tournamentTeam = tournamentTeams.find((entry) => entry.id === tournamentTeamId && isActive(entry))
    if (!tournamentTeam) throw new Error(`Tournament team ${tournamentTeamId} not found`)
    return tournamentTeam.teamId === match.homeTeamId
  }

  const bumpFinished = (match: Match) => {
    const tournament = tournaments.find((entry) => entry.id === match.tournamentId)
    if (tournament) tournament.finishedMatchCount += 1
  }

  const toStandingTeam = (tt: TournamentTeam): StandingTeamInput => ({
    tournamentTeamId: tt.id,
    teamId: tt.teamId,
    name: tt.displayNameSnapshot,
    tiebreakOrder: tt.tiebreakOrder,
    tiebreakBlockKey: tt.tiebreakBlockKey,
  })

  /** GET /tournaments/:id/standings — §8.7. The ranking rule lives here, not in the UI. */
  const buildStandings = (tournamentId: string, groupId?: string | null): StandingsEnvelope[] => {
    const tournament = requireTournament(tournamentId)
    const enrolled = tournamentTeams.filter((tt) => isActive(tt) && tt.tournamentId === tournamentId)
    const tournamentMatches = matches.filter((m) => m.tournamentId === tournamentId)

    const hasGroups = tournament.format === 'GROUP_STAGE' || tournament.format === 'GROUP_STAGE_KNOCKOUT'
    if (!hasGroups) {
      // A knockout bracket has no classification; a LEAGUE is one single group.
      if (tournament.format === 'KNOCKOUT') return []
      return [computeStandings(enrolled.map(toStandingTeam), tournamentMatches, null)]
    }

    const groups = tournamentGroups
      .filter((g) => isActive(g) && g.tournamentId === tournamentId && (!groupId || g.id === groupId))
      .sort((a, b) => a.sortOrder - b.sortOrder)

    return groups.map((group) => {
      const memberTeamIds = new Set(
        tournamentGroupTeams
          .filter((gt) => isActive(gt) && gt.groupId === group.id)
          .map((gt) => gt.teamId),
      )
      const members = enrolled.filter((tt) => memberTeamIds.has(tt.teamId))
      const groupMatches = tournamentMatches.filter((m) => m.tournamentGroupId === group.id)
      return computeStandings(members.map(toStandingTeam), groupMatches, { id: group.id, name: group.name })
    })
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
        leaders: emptyLeaders(),
        championTournamentTeamId: null,
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
      const record: TournamentTeam = {
        id: nextId('tournament-team'),
        tournamentId: input.tournamentId,
        teamId: input.teamId,
        displayNameSnapshot: input.displayName,
        seed: input.seed ?? null,
        tiebreakOrder: null,
        tiebreakBlockKey: null,
      }
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

    // ── Bracket ────────────────────────────────────────────────────────────────
    listBracketSlots(tournamentId: string): BracketSlot[] {
      return bracketSlots
        .filter((slot) => isActive(slot) && slot.tournamentId === tournamentId)
        .sort((a, b) => a.roundNumber - b.roundNumber || a.position - b.position)
    },
    createBracketSlot(input: CreateBracketSlotInput): BracketSlot {
      const inRound = bracketSlots.filter(
        (slot) => isActive(slot) && slot.tournamentId === input.tournamentId && slot.roundNumber === input.roundNumber,
      )
      const position = input.position ?? inRound.reduce((max, slot) => Math.max(max, slot.position), 0) + 1
      const slot: BracketSlot = {
        id: nextId('bracket-slot'),
        tournamentId: input.tournamentId,
        roundNumber: input.roundNumber,
        position,
        label: input.label ?? null,
        homeTournamentTeamId: null,
        awayTournamentTeamId: null,
        matchId: null,
        winnerTournamentTeamId: null,
      }
      bracketSlots.push(slot)
      return slot
    },
    updateBracketSlot(id: string, input: UpdateBracketSlotInput): BracketSlot {
      const slot = bracketSlots.find((entry) => entry.id === id && isActive(entry))
      if (!slot) throw new Error(`Bracket slot ${id} not found`)
      if (input.homeTournamentTeamId !== undefined) slot.homeTournamentTeamId = input.homeTournamentTeamId
      if (input.awayTournamentTeamId !== undefined) slot.awayTournamentTeamId = input.awayTournamentTeamId
      if (input.label !== undefined) slot.label = input.label
      if (
        slot.winnerTournamentTeamId !== null &&
        slot.winnerTournamentTeamId !== slot.homeTournamentTeamId &&
        slot.winnerTournamentTeamId !== slot.awayTournamentTeamId
      ) {
        slot.winnerTournamentTeamId = null
      }
      return slot
    },
    linkSlotMatch(input: LinkSlotMatchInput): BracketSlot {
      const slot = bracketSlots.find((entry) => entry.id === input.slotId && isActive(entry))
      if (!slot) throw new Error(`Bracket slot ${input.slotId} not found`)
      slot.matchId = input.matchId
      return slot
    },
    setSlotWinner(input: SetSlotWinnerInput): BracketSlot {
      const slot = bracketSlots.find((entry) => entry.id === input.slotId && isActive(entry))
      if (!slot) throw new Error(`Bracket slot ${input.slotId} not found`)
      if (![slot.homeTournamentTeamId, slot.awayTournamentTeamId].includes(input.winnerTournamentTeamId)) {
        throw new Error('Winner must be one of the slot sides')
      }
      slot.winnerTournamentTeamId = input.winnerTournamentTeamId
      const tournament = requireTournament(slot.tournamentId)
      if (tournament.status === 'COMPLETED') {
        tournament.status = 'IN_PROGRESS'
        tournament.championTournamentTeamId = null
      }
      return slot
    },

    championSuggestion(tournamentId: string): string | null {
      const tournament = requireTournament(tournamentId)
      if (tournament.format === 'GROUP_STAGE') return null
      if (tournament.format === 'LEAGUE') {
        const envelope = buildStandings(tournamentId)[0]
        return envelope?.standingsState === 'FINAL' ? envelope.rows.find((row) => row.position === 1)?.tournamentTeamId ?? null : null
      }
      const slots = bracketSlots.filter((slot) => isActive(slot) && slot.tournamentId === tournamentId)
      if (slots.length === 0) return null
      const lastRound = Math.max(...slots.map((slot) => slot.roundNumber))
      const finalRound = slots.filter((slot) => slot.roundNumber === lastRound)
      return finalRound.length === 1 ? finalRound[0].winnerTournamentTeamId : null
    },
    completeTournament(input: CompleteTournamentInput): Tournament {
      const tournament = requireTournament(input.tournamentId)
      if (tournament.status !== 'IN_PROGRESS') throw new Error('Only a tournament in progress can be completed')
      const champion = input.championTournamentTeamId
      if (tournament.format === 'GROUP_STAGE') {
        if (champion) throw new Error('A group stage has no champion')
      } else {
        if (!champion) throw new Error('Champion is required for this format')
        const enrolled = tournamentTeams.find((entry) => entry.id === champion && isActive(entry) && entry.tournamentId === input.tournamentId)
        if (!enrolled) throw new Error('Champion must be a team enrolled in this tournament')
        if ((tournament.format === 'KNOCKOUT' || tournament.format === 'GROUP_STAGE_KNOCKOUT') && !bracketSlots.some((slot) => isActive(slot) && slot.tournamentId === input.tournamentId && slot.winnerTournamentTeamId === champion)) {
          throw new Error('Champion must have won a bracket slot')
        }
      }
      tournament.status = 'COMPLETED'
      tournament.championTournamentTeamId = champion
      tournament.updatedAt = new Date().toISOString()
      return tournament
    },
    reopenTournament(input: ReopenTournamentInput): Tournament {
      const tournament = requireTournament(input.tournamentId)
      if (tournament.status !== 'COMPLETED') throw new Error('Only a completed tournament can be reopened')
      tournament.status = 'IN_PROGRESS'
      tournament.championTournamentTeamId = null
      tournament.updatedAt = new Date().toISOString()
      return tournament
    },
    removeBracketSlot(id: string): void {
      const slot = bracketSlots.find((entry) => entry.id === id && isActive(entry))
      if (!slot) return
      if (slot.matchId) {
        const match = matches.find((entry) => entry.id === slot.matchId)
        if (match?.status === 'FINISHED') throw new Error('Cannot remove a slot whose match is finished')
        if (match) match.status = 'CANCELLED'
      }
      slot.isDeleted = true
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
    updateRosterEntry(id: string, input: UpdateRosterEntryInput): RosterEntry {
      const entry = rosterEntries.find((record) => record.id === id)
      if (!entry) throw new Error('Roster entry not found')
      Object.assign(entry, input)
      return entry
    },
    removeRosterEntry(id: string): void {
      const entry = rosterEntries.find((record) => record.id === id)
      if (entry) entry.isDeleted = true
    },

    // ── Groups ─────────────────────────────────────────────────────────────────
    listGroups(tournamentId: string): TournamentGroup[] {
      return tournamentGroups
        .filter((g) => isActive(g) && g.tournamentId === tournamentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },
    createGroup(input: CreateGroupInput): TournamentGroup {
      const existing = tournamentGroups.filter((g) => isActive(g) && g.tournamentId === input.tournamentId)
      const sortOrder = input.sortOrder ?? existing.reduce((max, g) => Math.max(max, g.sortOrder), 0) + 1
      const group: TournamentGroup = { id: nextId('group'), tournamentId: input.tournamentId, name: input.name, sortOrder }
      tournamentGroups.push(group)
      return group
    },
    listGroupTeams(tournamentId: string): TournamentGroupTeam[] {
      return tournamentGroupTeams.filter((gt) => isActive(gt) && gt.tournamentId === tournamentId)
    },
    assignTeamToGroup(input: AssignGroupTeamInput): TournamentGroupTeam {
      const taken = tournamentGroupTeams.some(
        (gt) => isActive(gt) && gt.tournamentId === input.tournamentId && gt.teamId === input.teamId,
      )
      if (taken) throw new Error('Team already assigned to a group in this tournament')
      const record: TournamentGroupTeam = {
        id: nextId('group-team'),
        tournamentId: input.tournamentId,
        groupId: input.groupId,
        teamId: input.teamId,
      }
      tournamentGroupTeams.push(record)
      return record
    },
    removeGroupTeam(id: string): void {
      const record = tournamentGroupTeams.find((gt) => gt.id === id)
      if (record) record.isDeleted = true
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
        mvp: extra?.mvp ?? null,
      }
    },
    scheduleMatch(input: ScheduleMatchInput): Match {
      // A match filed into a group its two teams do not share would enter no classification
      // table at all — the ranking only counts a match when both sides are in the scope.
      if (input.groupId) {
        const inGroup = (teamId: string) =>
          tournamentGroupTeams.some((gt) => isActive(gt) && gt.groupId === input.groupId && gt.teamId === teamId)
        if (!inGroup(input.homeTeamId) || !inGroup(input.awayTeamId)) {
          throw new Error('Both teams must belong to the group of the match')
        }
      }

      const match: Match = {
        id: nextId('match'),
        tournamentId: input.tournamentId,
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
        tournamentGroupId: input.groupId ?? null,
        bracketRound: null,
      }
      matches.push(match)
      const tournament = tournaments.find((t) => t.id === input.tournamentId)
      if (tournament) tournament.matchCount += 1
      return match
    },
    submitMatchResult(input: SubmitMatchResultInput): Match {
      const match = matches.find((m) => m.id === input.matchId)
      if (!match) throw new Error(`Match ${input.matchId} not found`)

      if (input.resultType === 'FORFEIT') {
        const offenderIsHome = isHomeSide(match, input.offendingTournamentTeamId)
        match.status = 'FINISHED'
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
          mvp: null,
        })
        bumpFinished(match)
        return match
      }

      const mvp = resolveMvp(input.mvpTournamentRosterId, input.playerStats)
      const court = periodsSum(input.periods)
      match.status = 'FINISHED'

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
        mvp,
      })
      bumpFinished(match)
      return match
    },

    // ── Standings ──────────────────────────────────────────────────────────────
    listStandings(tournamentId: string, groupId?: string | null): StandingsEnvelope[] {
      return buildStandings(tournamentId, groupId)
    },
    setTiebreakOrder(input: SetTiebreakOrderInput): void {
      const submitted = input.entries.map((entry) => entry.tournamentTeamId)
      const key = [...submitted].sort().join('-')

      // The block must be one the norm itself produced — not a set the admin invented.
      const currentBlockKeys = new Set(
        buildStandings(input.tournamentId)
          .flatMap((envelope) => envelope.rows)
          .map((row) => row.tieBlockKey)
          .filter((blockKey): blockKey is string => blockKey !== null),
      )
      if (new Set(submitted).size !== submitted.length || !currentBlockKeys.has(key)) {
        throw new Error('Tied block no longer matches')
      }

      const orders = input.entries.map((entry) => entry.order).sort((a, b) => a - b)
      if (!orders.every((order, i) => order === i + 1)) {
        throw new Error('Tiebreak order must be a complete permutation')
      }

      for (const entry of input.entries) {
        const record = tournamentTeams.find((tt) => tt.id === entry.tournamentTeamId && isActive(tt))
        if (!record) throw new Error('Tied block no longer matches')
        record.tiebreakOrder = entry.order
        record.tiebreakBlockKey = key
      }
    },
    clearTiebreakOrder(input: ClearTiebreakOrderInput): void {
      for (const record of tournamentTeams) {
        if (record.tournamentId === input.tournamentId && record.tiebreakBlockKey === input.blockKey) {
          record.tiebreakOrder = null
          record.tiebreakBlockKey = null
        }
      }
    },
  }
}

export type SportsStore = ReturnType<typeof createSportsStore>
