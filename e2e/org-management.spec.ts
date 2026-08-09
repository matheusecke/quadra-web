import { expect, test, type Page } from '@playwright/test'

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
  test('lists organization users with the contractual read model', async ({ page }) => {
    await signIn(page, orgAdminEmail as string, orgAdminPassword as string)
    const response = page.waitForResponse(
      (r) => r.url().includes('/organization-user-affiliations') && r.request().method() === 'GET',
    )

    await page.goto('/users')
    const body = await (await response).json()

    expect(body.data[0]).toMatchObject({
      canManage: expect.any(Boolean),
      isInviteExpired: expect.any(Boolean),
    })
  })

  test('lists organization teams with the contractual counters', async ({ page }) => {
    await signIn(page, orgAdminEmail as string, orgAdminPassword as string)
    const response = page.waitForResponse(
      (r) => r.url().includes('/organization-team-affiliations') && r.request().method() === 'GET',
    )

    await page.goto('/teams')
    const body = await (await response).json()

    expect(body.data[0]).toMatchObject({
      activeUserCount: expect.any(Number),
      pendingAdminInviteCount: expect.any(Number),
    })
  })

  test('resolves an exact email through the user lookup', async ({ page }) => {
    test.skip(!inviteeEmail, 'Set E2E_INVITEE_EMAIL to exercise the lookup.')
    await signIn(page, orgAdminEmail as string, orgAdminPassword as string)
    await page.goto('/users')

    await page.getByRole('button', { name: 'Convidar pessoa' }).click()
    await page.getByLabel('E-mail da pessoa').fill(inviteeEmail as string)
    await page.getByRole('button', { name: 'Buscar' }).click()

    await expect(page.getByText(inviteeEmail as string)).toBeVisible()
  })

  test('shows the empty lookup state for an address with no active user', async ({ page }) => {
    await signIn(page, orgAdminEmail as string, orgAdminPassword as string)
    await page.goto('/users')

    await page.getByRole('button', { name: 'Convidar pessoa' }).click()
    await page.getByLabel('E-mail da pessoa').fill('nao-existe@example.invalid')
    await page.getByRole('button', { name: 'Buscar' }).click()

    await expect(page.getByText('Usuário ativo não encontrado')).toBeVisible()
  })

  test('serves the team candidate catalog to the onboarding drawer', async ({ page }) => {
    await signIn(page, orgAdminEmail as string, orgAdminPassword as string)
    await page.goto('/teams')
    const response = page.waitForResponse((r) => r.url().includes('/teams/affiliation-candidates'))

    await page.getByRole('button', { name: 'Adicionar equipe' }).click()
    await page.getByPlaceholder('Buscar equipe...').fill('a')

    expect((await response).status()).toBe(200)
  })

  test('redirects a team administrator away from the organization team list', async ({ page }) => {
    test.skip(!teamAdminEmail || !teamAdminPassword, 'Set the TEAM_ADMIN credentials.')
    await signIn(page, teamAdminEmail as string, teamAdminPassword as string)

    await page.goto('/teams')

    await expect(page).toHaveURL(/\/teams\/\d+$/)
  })

  test('offers the registration tab to a team administrator on their own team', async ({ page }) => {
    test.skip(!teamAdminEmail || !teamAdminPassword, 'Set the TEAM_ADMIN credentials.')
    await signIn(page, teamAdminEmail as string, teamAdminPassword as string)

    await page.goto('/teams')

    await expect(page.getByRole('tab', { name: 'Cadastro' })).toBeVisible()
  })

  test('scopes the user list of a team administrator to their own team', async ({ page }) => {
    test.skip(!teamAdminEmail || !teamAdminPassword, 'Set the TEAM_ADMIN credentials.')
    await signIn(page, teamAdminEmail as string, teamAdminPassword as string)

    await page.goto('/users')

    await expect(page.getByLabel('Filtrar usuários por equipe')).toBeHidden()
  })
})
