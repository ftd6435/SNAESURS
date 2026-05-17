import api from './client'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/user'

export interface LoginData {
  login: string
  password?: string
}

export interface OtpData {
  telephone: string
  otp: string
}

export interface RegisterData {
  full_name: string
  telephone: string
  email: string
  password: string
  password_confirmation: string
  adresse?: string
  genre?: string
  date_naissance?: string
  person_a_contacter?: string
  phone_person_a_contacter?: string
  structure_id?: number
  avatar?: File
}

export const authApi = {
  login: (data: LoginData) =>
    api.post<ApiResponse<User>>('/auth/login', data),

  verifyOtp: (data: OtpData) =>
    api.post<ApiResponse<User>>('/auth/verify-otp', data),

  resendOtp: (telephone: string) =>
    api.post<ApiResponse<{ telephone: string }>>('/auth/resend-otp', { telephone }),

  register: (data: FormData) =>
    api.post<ApiResponse<User>>('/auth/register', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  logout: () =>
    api.post<ApiResponse>('/auth/logout'),
}
