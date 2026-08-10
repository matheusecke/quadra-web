import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as accountApi from '../../services/accountApi'
import { setAccessToken } from '../../services/api'
import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from '../../types/api'

export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
}

export function useMyProfileQuery() {
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: accountApi.getMyProfile,
  })
}

export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => accountApi.updateMyProfile(input),
    // PATCH returns the whole read model, so seeding beats invalidating.
    onSuccess: (updated: MyProfile) => {
      queryClient.setQueryData(accountKeys.profile(), updated)
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => accountApi.changePassword(input),
    // The password change revoked the token the axios layer holds.
    onSuccess: (accessToken: string) => {
      setAccessToken(accessToken)
    },
  })
}
