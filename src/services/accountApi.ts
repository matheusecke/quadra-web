import api from './api'
import type {
  ApiResponse,
  ChangePasswordInput,
  MyProfile,
  TokenPayload,
  UpdateMyProfileInput,
} from '../types/api'

export const getMyProfile = () =>
  api.get<ApiResponse<MyProfile>>('/users/me').then((response) => response.data.data)

// No empty-value stripping here, unlike orgApi: null is the value that clears
// the height, and dropping it would silently turn "clear" into "keep".
export const updateMyProfile = (input: UpdateMyProfileInput) =>
  api.patch<ApiResponse<MyProfile>>('/users/me', input).then((response) => response.data.data)

export const changePassword = (input: ChangePasswordInput) =>
  api
    .post<ApiResponse<TokenPayload>>('/auth/change-password', input)
    .then((response) => response.data.data.accessToken)
