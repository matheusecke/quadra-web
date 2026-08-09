import axios from 'axios'

interface ApiErrorEnvelope {
  error?: {
    code?: string
    message?: string
    data?: Record<string, string[]>
  }
}

const envelope = (error: unknown) =>
  axios.isAxiosError<ApiErrorEnvelope>(error) ? error.response?.data.error : undefined

export const apiErrorCode = (error: unknown) => envelope(error)?.code
export const apiErrorMessage = (error: unknown) => envelope(error)?.message
export const apiErrorData = (error: unknown) => envelope(error)?.data

export const apiErrorStatus = (error: unknown) =>
  axios.isAxiosError(error) ? error.response?.status : undefined
