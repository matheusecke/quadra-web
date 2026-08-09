import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const orgAdminEmail = process.env.E2E_EMAIL
const orgAdminPassword = process.env.E2E_PASSWORD
const teamAdminEmail = process.env.E2E_TEAM_ADMIN_EMAIL
const teamAdminPassword = process.env.E2E_TEAM_ADMIN_PASSWORD
const inviteeEmail = process.env.E2E_INVITEE_EMAIL

test.skip(
  !orgAdminEmail || !orgAdminPassword,
  'Set E2E_EMAIL and E2E_PASSWORD to run the organization management gate.',
)

// Same flow as e2e/session-refresh.spec.ts: log in, then pick the first organization.
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.locator('input#password').fill(password)
  await page.getByRole('button', { name: /^Entrar$/ }).click()
  await page.waitForURL('**/select-org')
  await page.getByRole('button', { name: /^Entrar em / }).first().click()
  await page.waitForURL('**/home')
}

test.describe('organization management against the live API', () => {
  test.describe.configure({ mode: 'serial' })

  let orgAdminContext: BrowserContext
  let orgAdminPage: Page
  let teamAdminContext: BrowserContext | undefined
  let teamAdminPage: Page | undefined

  test.beforeAll(async ({ browser }) => {
    orgAdminContext = await browser.newContext()
    orgAdminPage = await orgAdminContext.newPage()
    await signIn(orgAdminPage, orgAdminEmail as string, orgAdminPassword as string)

    if (teamAdminEmail && teamAdminPassword) {
      teamAdminContext = await browser.newContext()
      teamAdminPage = await teamAdminContext.newPage()
      await signIn(teamAdminPage, teamAdminEmail, teamAdminPassword)
    }
  })

  test.afterAll(async () => {
    await orgAdminContext.close()
    await teamAdminContext?.close()
  })

  test('lists organization users with the contractual read model', async () => {
    const page = orgAdminPage
    const response = page.waitForResponse(
      (r) => r.url().includes('/organization-user-affiliations') && r.request().method() === 'GET',
    )

    await page.getByRole('link', { name: 'Usuários' }).click()
    const body = await (await response).json()

    expect(body.data[0]).toMatchObject({
      canManage: expect.any(Boolean),
      isInviteExpired: expect.any(Boolean),
    })
  })

  test('lists organization teams with the contractual counters', async () => {
    const page = orgAdminPage
    const response = page.waitForResponse(
      (r) => r.url().includes('/organization-team-affiliations') && r.request().method() === 'GET',
    )

    await page.getByRole('link', { name: 'Equipes' }).click()
    const body = await (await response).json()

    expect(body.data[0]).toMatchObject({
      activeUserCount: expect.any(Number),
      pendingAdminInviteCount: expect.any(Number),
    })
  })

  test('resolves an exact email through the user lookup', async () => {
    test.skip(!inviteeEmail, 'Set E2E_INVITEE_EMAIL to exercise the lookup.')
    const page = orgAdminPage
    await page.getByRole('link', { name: 'Usuários' }).click()

    await page.getByRole('button', { name: 'Convidar pessoa' }).click()
    await page.getByLabel('E-mail da pessoa').fill(inviteeEmail as string)
    await page.getByRole('button', { name: 'Buscar' }).click()

    await expect(page.getByText(inviteeEmail as string)).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
  })

  test('shows the empty lookup state for an address with no active user', async () => {
    const page = orgAdminPage
    await page.getByRole('button', { name: 'Convidar pessoa' }).click()
    await page.getByLabel('E-mail da pessoa').fill('nao-existe@example.invalid')
    await page.getByRole('button', { name: 'Buscar' }).click()

    await expect(page.getByText('Usuário ativo não encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
  })

  test('serves the team candidate catalog to the onboarding drawer', async () => {
    const page = orgAdminPage
    await page.getByRole('link', { name: 'Equipes' }).click()
    const response = page.waitForResponse((r) => r.url().includes('/teams/affiliation-candidates'))

    await page.getByRole('button', { name: 'Adicionar equipe' }).click()
    await page.getByRole('dialog', { name: 'Adicionar equipe' }).getByRole('combobox').fill('a')

    expect((await response).status()).toBe(200)
    await page.getByRole('button', { name: 'Cancelar' }).click()
  })

  test('redirects a team administrator away from the organization team list', async () => {
    test.skip(!teamAdminEmail || !teamAdminPassword, 'Set the TEAM_ADMIN credentials.')
    const page = teamAdminPage as Page

    await page.evaluate(() => {
      window.history.pushState({}, '', '/teams')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    await expect(page).toHaveURL(/\/teams\/\d+$/)
  })

  test('offers the registration tab to a team administrator on their own team', async () => {
    test.skip(!teamAdminEmail || !teamAdminPassword, 'Set the TEAM_ADMIN credentials.')
    const page = teamAdminPage as Page

    await expect(page.getByRole('tab', { name: 'Cadastro' })).toBeVisible()
  })

  test('scopes the user list of a team administrator to their own team', async () => {
    test.skip(!teamAdminEmail || !teamAdminPassword, 'Set the TEAM_ADMIN credentials.')
    const page = teamAdminPage as Page

    await page.getByRole('link', { name: 'Usuários' }).click()

    await expect(page.getByLabel('Filtrar usuários por equipe')).toBeHidden()
  })
})
