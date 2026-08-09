import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.skip(!email || !password, 'E2E credentials are required')

async function loginAndOpenTeams(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email!)
  await page.locator('input#password').fill(password!)
  await page.getByRole('button', { name: /^Entrar$/ }).click()
  await page.waitForURL('**/select-org')

  const organizations = page.getByRole('button', { name: /^Entrar em / })
  await expect(organizations).toHaveCount(2)
  const organizationName = (await organizations.first().getAttribute('aria-label'))!
    .replace('Entrar em ', '')
  await organizations.first().click()
  await page.waitForURL('**/home')
  await page.getByRole('link', { name: 'Equipes' }).click()
  await page.waitForURL('**/teams')
  await expect(page.getByRole('heading', { name: 'Equipes' })).toBeVisible()

  return organizationName
}

test.describe('session refresh against the live API', () => {
  test.describe.configure({ mode: 'serial' })

  let context: BrowserContext
  let page: Page
  let organizationName: string

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    organizationName = await loginAndOpenTeams(page)
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('keeps one protected route across repeated reloads', async () => {
    const refreshStatuses: number[] = []
    const visitedPaths: string[] = []

    page.on('response', (response) => {
      if (response.url().endsWith('/auth/refresh')) {
        refreshStatuses.push(response.status())
      }
    })
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        visitedPaths.push(new URL(frame.url()).pathname)
      }
    })

    for (let reload = 1; reload <= 3; reload += 1) {
      const previousCount = refreshStatuses.length
      visitedPaths.length = 0

      await page.reload()
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveURL(/\/teams$/)
      await expect(page.getByRole('heading', { name: 'Equipes' })).toBeVisible()
      await expect(page.locator('aside button[aria-expanded]')).toContainText(
        organizationName,
      )
      await expect.poll(() => refreshStatuses.length).toBe(previousCount + 1)
      expect(refreshStatuses.at(-1)).toBe(200)
      expect(visitedPaths).not.toContain('/login')
      expect(visitedPaths).not.toContain('/select-org')
    }
  })

  test('redirects to login only after a real refresh rejection', async () => {
    const logoutStatus = await page.evaluate(async () => {
      const { default: api } = await import('/src/services/api.ts')
      return (await api.post('/auth/logout')).status
    })
    expect(logoutStatus).toBeGreaterThanOrEqual(200)
    expect(logoutStatus).toBeLessThan(300)

    const visitedPaths: string[] = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        visitedPaths.push(new URL(frame.url()).pathname)
      }
    })

    const refreshResponse = page.waitForResponse((response) =>
      response.url().endsWith('/auth/refresh'),
    )
    await page.reload()

    expect((await refreshResponse).status()).toBe(401)
    await page.waitForURL('**/login')
    expect(visitedPaths).not.toContain('/select-org')
  })

  test('shares one real refresh between bootstrap and interceptor owners', async () => {
    await loginAndOpenTeams(page)

    let releaseRefresh!: () => void
    const refreshCanContinue = new Promise<void>((resolve) => {
      releaseRefresh = resolve
    })
    let refreshRequests = 0
    let meRequests = 0

    await page.route('**/auth/refresh', async (route) => {
      refreshRequests += 1
      await refreshCanContinue
      await route.continue()
    })
    await page.route('**/auth/me', async (route) => {
      meRequests += 1
      if (meRequests === 1) {
        await route.fulfill({ status: 401, json: { message: 'expired access' } })
        return
      }
      await route.continue()
    })

    const concurrentOwners = page.evaluate(async () => {
      const { default: api, refreshAccessToken } = await import(
        '/src/services/api.ts'
      )
      return Promise.all([refreshAccessToken(), api.get('/auth/me')])
    })

    await expect.poll(() => meRequests).toBe(1)
    expect(refreshRequests).toBe(1)
    releaseRefresh()
    await concurrentOwners

    expect(refreshRequests).toBe(1)
    expect(meRequests).toBe(2)
  })
})
