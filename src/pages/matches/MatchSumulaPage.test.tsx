import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MatchSumulaPage } from './MatchSumulaPage'
import * as sportsApi from '../../services/sportsApi'

const renderSumula = (matchId: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/matches/${matchId}/sumula`]}>
        <Routes>
          <Route path="/matches/:matchId/sumula" element={<MatchSumulaPage />} />
          <Route path="/matches/:matchId" element={<div>detalhe da partida</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchSumulaPage', () => {
  it('warns when total points do not match the final score', async () => {
    renderSumula('match-1')
    const anyPts = await screen.findAllByLabelText(/pts/i)
    await userEvent.type(anyPts[0], '5')
    await waitFor(() => expect(screen.getByText(/não confere com o placar/i)).toBeInTheDocument())
  }, 10_000)

  it('submits the result and returns to the match detail', async () => {
    renderSumula('match-1')
    await userEvent.click(await screen.findByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(await screen.findByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())
  }, 10_000)

  it('disables a column from the panel and submits null for it', async () => {
    renderSumula('match-1')
    await userEvent.click(await screen.findByRole('button', { name: /configurar estatísticas/i }))
    await userEvent.click(screen.getByRole('switch', { name: /rebotes/i }))
    await userEvent.click(screen.getByRole('button', { name: /descartar/i }))

    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())

    const detail = await sportsApi.getMatchDetail('match-1')
    expect([...detail!.homeStats.players, ...detail!.awayStats.players].every((player) => player.reb === null)).toBe(true)
  }, 10_000)

  it('reopens disabled columns as N/A, re-enables them, and confirms point data loss', async () => {
    renderSumula('match-1')
    await userEvent.click(await screen.findByRole('button', { name: /configurar estatísticas/i }))
    await userEvent.click(screen.getByRole('switch', { name: /tocos/i }))
    await userEvent.click(screen.getByRole('button', { name: /descartar e desabilitar/i }))

    await userEvent.click(screen.getByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())

    renderSumula('match-1')
    await userEvent.click(await screen.findByRole('button', { name: /configurar estatísticas/i }))
    const blocksToggle = screen.getByRole('switch', { name: /tocos/i })
    expect(blocksToggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('columnheader', { name: /BLK — não acompanhada/i })).toBeInTheDocument()
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)

    await userEvent.click(blocksToggle)
    expect(blocksToggle).toHaveAttribute('aria-checked', 'true')
    const blockInputs = screen.getAllByLabelText(/— BLK$/)
    expect(blockInputs.every((input) => input.getAttribute('value') === '0')).toBe(true)
    expect(blockInputs.every((input) => !input.hasAttribute('disabled'))).toBe(true)

    const pointsInput = screen.getAllByLabelText(/— PTS$/)[0]
    await userEvent.clear(pointsInput)
    await userEvent.type(pointsInput, '5')
    await userEvent.click(screen.getByRole('switch', { name: /pontos/i }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(pointsInput).toHaveValue(5)

    await userEvent.click(screen.getByRole('switch', { name: /pontos/i }))
    await userEvent.click(screen.getByRole('button', { name: /descartar e desabilitar/i }))
    expect(screen.getByRole('columnheader', { name: /PTS — não acompanhada/i })).toBeInTheDocument()
  }, 10_000)

  it('keeps the statistic controls keyboard-accessible switches', async () => {
    renderSumula('match-1')
    const configButton = await screen.findByRole('button', { name: /configurar estatísticas/i })
    expect(configButton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(configButton)
    expect(configButton).toHaveAttribute('aria-expanded', 'true')
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(9)
    switches.forEach((toggle) => expect(toggle).toHaveAttribute('aria-checked'))

    configButton.focus()
    for (const toggle of switches) {
      await userEvent.tab()
      expect(toggle).toHaveFocus()
    }
  }, 10_000)
})

describe('MatchSumulaPage — W.O.', () => {
  it('hides the súmula entirely when the match is a W.O.', async () => {
    renderSumula('match-1')
    await userEvent.click(await screen.findByLabelText(/como a partida terminou/i))
    await userEvent.click(screen.getByRole('option', { name: 'W.O.' }))
    await userEvent.click(screen.getByLabelText(/equipe que não compareceu/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    expect(screen.queryByText(/placar por período/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/mvp da partida/i)).not.toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  }, 10_000)
})

describe('MatchSumulaPage — abandonment', () => {
  it('warns that the official score will be assigned by the rules', async () => {
    renderSumula('match-1')
    await userEvent.click(await screen.findByLabelText(/como a partida terminou/i))
    await userEvent.click(screen.getByRole('option', { name: 'Abandono' }))
    await userEvent.click(screen.getByLabelText(/equipe que abandonou/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    expect(screen.getByText(/placar oficial será atribuído/i)).toBeInTheDocument()
  }, 10_000)
})
