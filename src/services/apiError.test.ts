import { describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { apiErrorCode } from './apiError'

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
