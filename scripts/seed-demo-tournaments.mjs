// Uso: node scripts/seed-demo-tournaments.mjs
// Cria os campeonatos de demonstração no banco local, na ordem que reproduz os ids do mock.
const API = process.env.VITE_API_URL ?? 'http://localhost:3001'
const EMAIL = process.env.SEED_EMAIL ?? 'matheusecke@gmail.com'
const PASSWORD = process.env.SEED_PASSWORD ?? 'sorvete1'

const TOURNAMENTS = [
  { name: 'Campeonato Geral da PUC 2026', format: 'GROUP_STAGE_KNOCKOUT', status: 'IN_PROGRESS', startsAt: '2026-03-01T03:00:00.000Z', endsAt: '2026-05-31T03:00:00.000Z' },
  { name: 'Copa de Inverno PUC', format: 'GROUP_STAGE_KNOCKOUT', status: 'REGISTRATION', startsAt: '2026-07-01T03:00:00.000Z', endsAt: '2026-07-31T03:00:00.000Z' },
  { name: 'Campeonato de Fixtures', format: 'GROUP_STAGE', status: 'IN_PROGRESS' },
]

const login = async () => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`login falhou: ${res.status}`)
  const body = await res.json()
  // /auth/org (abaixo) exige o refresh token httpOnly da sessão, não só o access token.
  const setCookie = res.headers.get('set-cookie')
  const refreshCookie = setCookie ? setCookie.split(';')[0] : null
  return { accessToken: body.data.accessToken, organizations: body.data.organizations, refreshCookie }
}

// A conta de seed pertence a mais de uma organização: o access token do login por si só não
// tem organizationId (multi-tenant) e /seasons, /tournaments respondem 401 sem esse passo.
const chooseOrg = async (accessToken, refreshCookie, organizationId) => {
  const res = await fetch(`${API}/auth/org`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(refreshCookie ? { Cookie: refreshCookie } : {}),
    },
    body: JSON.stringify({ organizationId }),
  })
  if (!res.ok) throw new Error(`seleção de organização falhou: ${res.status}`)
  const body = await res.json()
  return body.data.accessToken
}

const firstSeasonId = async (token) => {
  const res = await fetch(`${API}/seasons?limit=1`, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json()
  const season = body.data?.[0]
  if (!season) throw new Error('nenhuma temporada no banco — crie uma antes de semear campeonatos')
  return season.id
}

const { accessToken, organizations, refreshCookie } = await login()
if (!organizations?.length) throw new Error('usuário de seed não pertence a nenhuma organização')
const token = await chooseOrg(accessToken, refreshCookie, organizations[0].organizationId)
const seasonId = await firstSeasonId(token)

for (const tournament of TOURNAMENTS) {
  const res = await fetch(`${API}/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...tournament, seasonId }),
  })
  const body = await res.json()
  console.log(res.ok ? `criado #${body.data.id} ${body.data.name}` : `falhou ${res.status}: ${JSON.stringify(body)}`)
}
