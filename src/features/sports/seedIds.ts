/** Deterministic ID formulas shared by mock-sports-data.ts and services/sportsApi/index.ts,
 *  so seeded box scores and seeded roster entries always agree on the same roster ID. */
export const SEED_TOURNAMENT = { GERAL: 1, INVERNO: 2, FIXTURES: 3 } as const

export function tournamentTeamId(tournamentId: number, teamId: number): number {
  return 1000 * tournamentId + teamId
}

export function seedRosterId(tournamentId: number, athleteId: number): number {
  return 700_000 + tournamentId * 1_000 + (athleteId - 100)
}
