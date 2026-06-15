import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AthleteDetailPage } from './AthleteDetailPage'

function renderAthletePage(athleteId = 'a1') {
  return render(
    <MemoryRouter initialEntries={[`/athletes/${athleteId}`]}>
      <Routes>
        <Route path="/athletes/:athleteId" element={<AthleteDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function waitForAthletePage() {
  await screen.findByRole('heading', { name: /rafael moura/i })
}

describe('AthleteDetailPage', () => {
  it('renders athlete header with jersey number, name, abbreviated position, current team and status only', async () => {
    renderAthletePage()

    await waitForAthletePage()

    const header = screen.getByTestId('athlete-header')
    expect(within(header).getByText('#3')).toBeInTheDocument()
    expect(within(header).getByRole('heading', { name: /rafael moura/i })).toBeInTheDocument()
    expect(within(header).getByText(/SG · Tigres do Vale/i)).toBeInTheDocument()
    expect(within(header).getByText('Ativo')).toBeInTheDocument()
    expect(within(header).queryByText(/organização/i)).not.toBeInTheDocument()
    expect(within(header).queryByText(/2025\/26/i)).not.toBeInTheDocument()
  })

  it('shows only Resumo, Partidas and Campeonatos tabs and no eFG metric', async () => {
    renderAthletePage()

    await waitForAthletePage()

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Resumo',
      'Partidas',
      'Campeonatos',
    ])
    expect(screen.getByRole('heading', { name: 'Totais' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Médias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aproveitamento' })).toBeInTheDocument()
    expect(screen.queryByText(/eFG/i)).not.toBeInTheDocument()
  })

  it('shows full matchup rows in Partidas and links rows to match details without an opponent column', async () => {
    const user = userEvent.setup()
    renderAthletePage()

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Partidas' }))

    expect(screen.queryByRole('columnheader', { name: /adversário/i })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /partida/i })).toBeInTheDocument()
    expect(screen.getByText('Tigres do Vale × Bisões')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tigres do vale × bisões/i })).toHaveAttribute('href', '/matches/m1')
  })

  it('shows team context in Campeonatos and links rows to championship details', async () => {
    const user = userEvent.setup()
    renderAthletePage()

    await waitForAthletePage()
    await user.click(screen.getByRole('tab', { name: 'Campeonatos' }))

    expect(screen.getByRole('columnheader', { name: /equipe/i })).toBeInTheDocument()
    expect(screen.getByText('Tigres do Vale')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /liga metropolitana/i })).toHaveAttribute('href', '/championships/c1')
  })
})
