import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.skip(!email || !password, 'E2E credentials are required')

// A conta de teste pertence a mais de uma organização: o login cai em /select-org antes
// de /home, e é preciso escolher uma organização (mesmo fluxo de e2e/session-refresh.spec.ts).
async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email!)
  await page.locator('input#password').fill(password!)
  await page.getByRole('button', { name: /^Entrar$/ }).click()
  await page.waitForURL('**/select-org')
  await page.getByRole('button', { name: /^Entrar em / }).first().click()
  await page.waitForURL('**/home')
  await page.getByRole('link', { name: 'Campeonatos' }).click()
  await page.waitForURL('**/tournaments')
}

test('cria, inicia, encerra e reabre um campeonato de fase de grupos', async ({ page }) => {
  await page.route(
    '**/auth/refresh',
    (route) => route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
    { times: 1 },
  )
  await login(page)

  await page.getByRole('button', { name: 'Novo campeonato' }).click()
  const name = `E2E Fase de Grupos ${Date.now()}`
  await page.getByLabel('Nome').fill(name)
  await page.getByLabel('Temporada').click()
  await page.getByRole('option').first().click()
  await page.getByLabel('Formato').click()
  await page.getByRole('option', { name: 'Fase de grupos' }).click()
  await page.getByLabel('Status').click()
  await page.getByRole('option', { name: 'Em andamento' }).click()
  await page.getByRole('button', { name: 'Criar campeonato' }).click()

  await expect(page.getByRole('heading', { name })).toBeVisible()

  await page.getByRole('button', { name: 'Encerrar campeonato' }).click()
  await page.getByRole('button', { name: 'Confirmar encerramento' }).click()
  await expect(page.getByText('Encerrado')).toBeVisible()

  await page.getByRole('button', { name: 'Reabrir campeonato' }).click()
  await page.getByRole('button', { name: 'Confirmar reabertura' }).click()
  await expect(page.getByText('Em andamento')).toBeVisible()
})
