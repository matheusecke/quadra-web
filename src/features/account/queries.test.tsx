import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  accountKeys,
  useChangePasswordMutation,
  useMyProfileQuery,
  useUpdateMyProfileMutation,
} from './queries'
import * as accountApi from '../../services/accountApi'
import { setAccessToken } from '../../services/api'

vi.mock('../../services/accountApi')
vi.mock('../../services/api', async () => {
  const actual = await vi.importActual<typeof import('../../services/api')>('../../services/api')
  return { ...actual, setAccessToken: vi.fn() }
})

const profile = {
  id: 1,
  email: 'user@example.com',
  name: 'User Name',
  birthDate: '1998-04-23',
  heightCm: 182,
}

function createHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { queryClient, wrapper }
}

describe('useMyProfileQuery', () => {
  beforeEach(() => {
    vi.mocked(accountApi.getMyProfile).mockReset()
    vi.mocked(accountApi.getMyProfile).mockResolvedValue(profile)
  })

  it('reads the profile into the account cache key', async () => {
    const { queryClient, wrapper } = createHarness()
    const { result } = renderHook(() => useMyProfileQuery(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(profile))
    expect(queryClient.getQueryData(accountKeys.profile())).toEqual(profile)
  })
})

describe('useUpdateMyProfileMutation', () => {
  beforeEach(() => {
    vi.mocked(accountApi.updateMyProfile).mockReset()
  })

  it('writes the server response straight into the cache', async () => {
    const updated = { ...profile, name: 'Renamed User' }
    vi.mocked(accountApi.updateMyProfile).mockResolvedValue(updated)
    const { queryClient, wrapper } = createHarness()
    const { result } = renderHook(() => useUpdateMyProfileMutation(), { wrapper })
    await result.current.mutateAsync({ name: 'Renamed User' })

    expect(queryClient.getQueryData(accountKeys.profile())).toEqual(updated)
  })

  it('forwards an explicit null height instead of dropping it', async () => {
    vi.mocked(accountApi.updateMyProfile).mockResolvedValue({ ...profile, heightCm: null })
    const { wrapper } = createHarness()
    const { result } = renderHook(() => useUpdateMyProfileMutation(), { wrapper })
    await result.current.mutateAsync({ heightCm: null })

    expect(accountApi.updateMyProfile).toHaveBeenCalledWith({ heightCm: null })
  })
})

describe('useChangePasswordMutation', () => {
  beforeEach(() => {
    vi.mocked(accountApi.changePassword).mockReset()
    vi.mocked(setAccessToken).mockReset()
  })

  it('adopts the rotated access token', async () => {
    vi.mocked(accountApi.changePassword).mockResolvedValue('rotated-token')
    const { wrapper } = createHarness()
    const { result } = renderHook(() => useChangePasswordMutation(), { wrapper })
    await result.current.mutateAsync({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
    })

    expect(setAccessToken).toHaveBeenCalledWith('rotated-token')
  })

  it('leaves the current token alone when the change fails', async () => {
    vi.mocked(accountApi.changePassword).mockRejectedValue(new Error('wrong password'))
    const { wrapper } = createHarness()
    const { result } = renderHook(() => useChangePasswordMutation(), { wrapper })
    await expect(
      result.current.mutateAsync({ currentPassword: 'wrong', newPassword: 'newpassword1' }),
    ).rejects.toThrow()

    expect(setAccessToken).not.toHaveBeenCalled()
  })
})
