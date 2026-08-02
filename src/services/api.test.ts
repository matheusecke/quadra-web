import { beforeEach, describe, expect, it, vi } from 'vitest'
import buildURL from 'axios/unsafe/helpers/buildURL.js'

const axiosMock = vi.hoisted(() => {
  let responseRejected: ((error: unknown) => Promise<unknown>) | undefined
  const instance = Object.assign(vi.fn(), {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: {
        use: vi.fn(
          (_fulfilled: unknown, rejected: (error: unknown) => Promise<unknown>) => {
            responseRejected = rejected
          },
        ),
      },
    },
  })

  return {
    instance,
    getResponseRejected: () => responseRejected,
  }
})

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosMock.instance),
    isAxiosError: (error: unknown) =>
      Boolean(error && typeof error === 'object' && 'isAxiosError' in error),
  },
}))

import { PARAMS_SERIALIZER, refreshAccessToken } from './api'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

const refreshResponse = (accessToken: string) => ({
  data: { data: { accessToken } },
})

describe('refreshAccessToken', () => {
  beforeEach(() => {
    axiosMock.instance.mockReset()
    axiosMock.instance.post.mockReset()
  })

  it('shares one refresh request between simultaneous callers', async () => {
    const pending = deferred<ReturnType<typeof refreshResponse>>()
    axiosMock.instance.post.mockReturnValueOnce(pending.promise)

    const first = refreshAccessToken()
    const second = refreshAccessToken()

    expect(first).toBe(second)
    expect(axiosMock.instance.post).toHaveBeenCalledTimes(1)

    pending.resolve(refreshResponse('renewed-token'))
    await expect(Promise.all([first, second])).resolves.toEqual([
      'renewed-token',
      'renewed-token',
    ])
  })

  it('releases a rejected refresh so a later caller can retry', async () => {
    axiosMock.instance.post
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(refreshResponse('retry-token'))

    await expect(refreshAccessToken()).rejects.toThrow('network unavailable')
    await expect(refreshAccessToken()).resolves.toBe('retry-token')
    expect(axiosMock.instance.post).toHaveBeenCalledTimes(2)
  })

  it('shares one refresh between concurrent interceptor retries', async () => {
    const pending = deferred<ReturnType<typeof refreshResponse>>()
    axiosMock.instance.post.mockReturnValueOnce(pending.promise)
    axiosMock.instance.mockResolvedValue({ data: { data: 'retried' } })

    const rejectResponse = axiosMock.getResponseRejected()!
    const first = rejectResponse({
      isAxiosError: true,
      response: { status: 401 },
      config: { url: '/teams', headers: {} },
    })
    const second = rejectResponse({
      isAxiosError: true,
      response: { status: 401 },
      config: { url: '/users', headers: {} },
    })

    expect(axiosMock.instance.post).toHaveBeenCalledTimes(1)
    pending.resolve(refreshResponse('shared-token'))
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(axiosMock.instance).toHaveBeenCalledTimes(2)
  })

  it('shares a bootstrap refresh with an interceptor retry', async () => {
    const pending = deferred<ReturnType<typeof refreshResponse>>()
    axiosMock.instance.post.mockReturnValueOnce(pending.promise)
    axiosMock.instance.mockResolvedValue({ data: { data: 'retried' } })

    const bootstrap = refreshAccessToken()
    const interceptorRetry = axiosMock.getResponseRejected()!({
      isAxiosError: true,
      response: { status: 401 },
      config: { url: '/teams', headers: {} },
    })

    expect(axiosMock.instance.post).toHaveBeenCalledTimes(1)
    pending.resolve(refreshResponse('shared-token'))
    await expect(Promise.all([bootstrap, interceptorRetry])).resolves.toEqual([
      'shared-token',
      { data: { data: 'retried' } },
    ])
  })
})

describe('serialização de query params', () => {
  it('repete a chave para listas em vez de emitir ids[]', () => {
    expect(buildURL('/tournaments', { ids: [12, 15], seasonId: 3 }, PARAMS_SERIALIZER))
      .toBe('/tournaments?ids=12&ids=15&seasonId=3')
  })

  it('mantém um parâmetro escalar intacto', () => {
    expect(buildURL('/seasons', { q: 'copa' }, PARAMS_SERIALIZER)).toBe('/seasons?q=copa')
  })

  it('serializes match id filters as repeated query params', () => {
    expect(buildURL('/matches', { ids: [501, 508], tournamentTeamIds: [41, 52] }, PARAMS_SERIALIZER))
      .toBe('/matches?ids=501&ids=508&tournamentTeamIds=41&tournamentTeamIds=52')
  })
})
