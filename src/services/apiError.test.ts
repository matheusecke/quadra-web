import { describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { apiErrorCode, apiErrorStatus } from './apiError'

const axiosErrorWith = (data: unknown) => {
  const error = new AxiosError('failed')
  error.response = { data, status: 409, statusText: 'Conflict', headers: {}, config: error.config! }
  return error
}

describe('apiErrorCode', () => {
  it('reads the code from the API error envelope', () => {
    expect(apiErrorCode(axiosErrorWith({ error: { code: 'DUPLICATE_RECORD' }, statusCode: 409 }))).toBe('DUPLICATE_RECORD')
  })

  it('returns undefined for an error that did not come from the API', () => {
    expect(apiErrorCode(new Error('network down'))).toBeUndefined()
  })
})

it('reads the HTTP status out of an axios failure', () => {
  const error = Object.assign(new Error('nope'), {
    isAxiosError: true,
    response: { status: 409, data: { error: { code: 'C', message: 'nope' } } },
  })

  expect(apiErrorStatus(error)).toBe(409)
})

it('reports no status for a non-axios failure', () => {
  expect(apiErrorStatus(new Error('offline'))).toBeUndefined()
})
