import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { GroupsTab } from './GroupsTab'
import * as sportsApi from '../../../services/sportsApi'
import { teamMap } from '../../../features/sports/sportsUtils'
import type {
  StandingRow,
  StandingsEnvelope,
  Team,
  Tournament,
  TournamentGroup,
  TournamentGroupTeam,
  TournamentTeam,
} from '../../../features/sports/types'

// useIsOrgAdmin reads from AuthContext, which no test here provides — mocked the same way
// TournamentDetailPage.test.tsx does.
const { mockIsOrgAdmin } = vi.hoisted(() => ({ mockIsOrgAdmin: vi.fn(() => false) }))
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => mockIsOrgAdmin() }))

const tournament = { id: 999, name: 'Copa', format: 'GROUP_STAGE' } as unknown as Tournament

const team: Team = { id: 501, name: 'Equipe de Teste', shortName: 'EQT' }
const team2: Team = { id: 502, name: 'Equipe B', shortName: 'EQB' }

const groupA: TournamentGroup = { id: 701, tournamentId: tournament.id, name: 'Grupo A', sortOrder: 1 }
const groupB: TournamentGroup = { id: 702, tournamentId: tournament.id, name: 'Grupo B', sortOrder: 2 }

const registration: TournamentTeam = {
  id: 801, tournamentId: tournament.id, teamId: team.id, displayNameSnapshot: team.name,
  seed: null, tiebreakOrder: null, tiebreakBlockKey: null,
}
const registration2: TournamentTeam = {
  id: 802, tournamentId: tournament.id, teamId: team2.id, displayNameSnapshot: team2.name,
  seed: null, tiebreakOrder: null, tiebreakBlockKey: null,
}

const membership: TournamentGroupTeam = {
  id: 901, tournamentId: tournament.id, tournamentGroupId: groupA.id, tournamentTeamId: registration.id,
}

const envelope: StandingsEnvelope = {
  group: { id: groupA.id, name: groupA.name },
  standingsState: 'EMPTY',
  pendingMatches: 0,
  rows: [{
    position: null, tournamentTeamId: registration.id, teamId: team.id, teamName: team.name,
    played: 0, wins: 0, losses: 0, classificationPoints: 0, pointsFor: 0, pointsAgainst: 0,
    pointDiff: 0, winPct: null, isTiedUnresolved: false, tieBlockKey: null,
  }],
}

const tiedRow = (registrationId: number, teamId: number, teamName: string, position: number): StandingRow => ({
  position, tournamentTeamId: registrationId, teamId, teamName,
  played: 2, wins: 1, losses: 1, classificationPoints: 3, pointsFor: 150, pointsAgainst: 150,
  pointDiff: 0, winPct: 0.5, isTiedUnresolved: true, tieBlockKey: '801-802',
})

const tiedEnvelope: StandingsEnvelope = {
  group: { id: groupA.id, name: groupA.name },
  standingsState: 'PARTIAL',
  pendingMatches: 2,
  rows: [
    tiedRow(registration.id, team.id, team.name, 1),
    tiedRow(registration2.id, team2.id, team2.name, 2),
  ],
}

const apiError = (statusCode: number, code: string) =>
  Object.assign(new axios.AxiosError('erro'), { response: { status: statusCode, data: { error: { code }, statusCode } } })

function renderTab({
  isOrgAdmin = false,
  groups = [groupA, groupB],
  groupTeams = [membership],
  tournamentTeams = [registration, registration2],
  envelopes = [envelope],
}: {
  isOrgAdmin?: boolean
  groups?: TournamentGroup[]
  groupTeams?: TournamentGroupTeam[]
  tournamentTeams?: TournamentTeam[]
  envelopes?: StandingsEnvelope[]
} = {}) {
  mockIsOrgAdmin.mockReturnValue(isOrgAdmin)
  vi.spyOn(sportsApi, 'getGroups').mockResolvedValue(groups)
  vi.spyOn(sportsApi, 'getGroupTeams').mockResolvedValue(groupTeams)
  vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(tournamentTeams)
  vi.spyOn(sportsApi, 'listStandings').mockResolvedValue(envelopes)

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <GroupsTab tournament={tournament} teams={teamMap([team, team2])} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

/** Opens the block's panel from its row action, then saves the positions it seeded (1º, 2º). */
async function registerDraw() {
  const rowActions = await screen.findAllByRole('button', { name: /^registrar sorteio$/i })
  await userEvent.click(rowActions[0])
  const buttons = screen.getAllByRole('button', { name: /^registrar sorteio$/i })
  await userEvent.click(buttons[buttons.length - 1])
}

async function createGroup(name: string) {
  await userEvent.type(await screen.findByLabelText(/^nome do grupo$/i), name)
  await userEvent.click(screen.getByRole('button', { name: /criar grupo/i }))
}

describe('GroupsTab', () => {
  it('lets an admin create the first group when the tournament has none', async () => {
    renderTab({ isOrgAdmin: true, groups: [], groupTeams: [], envelopes: [] })
    expect(await screen.findByRole('button', { name: /criar grupo/i })).toBeInTheDocument()
    expect(screen.getByText(/nenhum grupo criado ainda/i)).toBeInTheDocument()
  })

  it('explains a duplicate group name from the api error code', async () => {
    vi.spyOn(sportsApi, 'createGroup').mockRejectedValue(apiError(409, 'DUPLICATE_RECORD'))
    renderTab({ isOrgAdmin: true })
    await createGroup('Grupo A')
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um grupo com esse nome neste campeonato.')
  })

  it('explains a team already assigned to a group from the api error code', async () => {
    vi.spyOn(sportsApi, 'assignTeamToGroup').mockRejectedValue(apiError(409, 'TEAM_ALREADY_ASSIGNED'))
    renderTab({ isOrgAdmin: true })
    await screen.findByRole('group', { name: 'Grupo A' })
    await userEvent.click(screen.getByLabelText(/^grupo$/i))
    await userEvent.click(screen.getByRole('option', { name: 'Grupo A' }))
    await userEvent.click(screen.getByLabelText(/^equipe$/i))
    await userEvent.click(screen.getByRole('option', { name: 'Equipe B' }))
    await userEvent.click(screen.getByRole('button', { name: /adicionar ao grupo/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Esta equipe já está em um grupo deste campeonato.')
  })

  it('explains a non-empty group deletion from the api error code', async () => {
    vi.spyOn(sportsApi, 'removeGroup').mockRejectedValue(apiError(409, 'GROUP_NOT_EMPTY'))
    renderTab({ isOrgAdmin: true })
    const groupBSection = await screen.findByRole('group', { name: 'Grupo B' })
    await userEvent.click(within(groupBSection).getByRole('button', { name: /excluir grupo/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Remova as equipes do grupo antes de excluí-lo.')
  })

  it('explains a locked tournament from the api error code', async () => {
    vi.spyOn(sportsApi, 'createGroup').mockRejectedValue(apiError(409, 'TOURNAMENT_NOT_MUTABLE'))
    renderTab({ isOrgAdmin: true })
    await createGroup('Grupo C')
    expect(await screen.findByRole('alert')).toHaveTextContent('Este campeonato não permite mais alterações.')
  })

  it('falls back to a generic message for an unmapped error code', async () => {
    vi.spyOn(sportsApi, 'createGroup').mockRejectedValue(apiError(422, 'SOME_UNKNOWN_CODE'))
    renderTab({ isOrgAdmin: true })
    await createGroup('Grupo D')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível criar o grupo.')
  })

  it('explains a tied block the server no longer recognises', async () => {
    vi.spyOn(sportsApi, 'setTiebreakOrder').mockRejectedValue(apiError(409, 'TIE_BLOCK_MISMATCH'))
    renderTab({ isOrgAdmin: true, envelopes: [tiedEnvelope] })
    await registerDraw()
    expect(await screen.findByRole('alert')).toHaveTextContent('A composição do empate mudou. Recarregue a classificação.')
  })

  it('reloads the classification when the tied block no longer exists', async () => {
    vi.spyOn(sportsApi, 'setTiebreakOrder').mockRejectedValue(apiError(409, 'TIE_BLOCK_MISMATCH'))
    renderTab({ isOrgAdmin: true, envelopes: [tiedEnvelope] })
    await screen.findAllByRole('button', { name: /^registrar sorteio$/i })

    // The result that dissolved the block landed between the two requests.
    vi.mocked(sportsApi.listStandings).mockResolvedValue([envelope])
    await registerDraw()

    expect(await screen.findByText(/nenhuma partida finalizada/i)).toBeInTheDocument()
  })

  it('explains a locked tournament when registering a draw', async () => {
    vi.spyOn(sportsApi, 'setTiebreakOrder').mockRejectedValue(apiError(409, 'TOURNAMENT_NOT_MUTABLE'))
    renderTab({ isOrgAdmin: true, envelopes: [tiedEnvelope] })
    await registerDraw()
    expect(await screen.findByRole('alert')).toHaveTextContent('O campeonato está encerrado. Reabra-o para alterar o sorteio.')
  })

  it('keeps the membership action out of the standings rows', async () => {
    renderTab({ isOrgAdmin: true })
    await screen.findByRole('group', { name: 'Grupo A' })
    expect(screen.queryAllByRole('button', { name: /remover do grupo/i })).toHaveLength(0)
  })

  it('shows groups and their teams to a non-admin with no write controls', async () => {
    renderTab({ isOrgAdmin: false })
    const groupASection = await screen.findByRole('group', { name: 'Grupo A' })
    expect(within(groupASection).getByText(team.name)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /criar grupo/i })).not.toBeInTheDocument()
  })
})
