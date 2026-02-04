import { apiClient } from './api'
import type {
  LoginResponse,
  CurrentUserResponse,
  LogoutResponse,
  RoleAccessResponse,
} from '../types/api'

export const authApi = {
  // Login user and get token
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', { email, password })
  },

  // Get current authenticated user
  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    return apiClient.get<CurrentUserResponse>('/auth/me')
  },

  // Logout user
  logout: async (): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>('/auth/logout')
  },

  // Admin only endpoint
  adminOnly: async (): Promise<RoleAccessResponse> => {
    return apiClient.get<RoleAccessResponse>('/auth/admin-only')
  },

  // Supervisor area endpoint
  supervisorArea: async (): Promise<RoleAccessResponse> => {
    return apiClient.get<RoleAccessResponse>('/auth/supervisor-area')
  },
}

// Helper functions for token management
export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token')
  },

  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token)
  },

  removeToken: (): void => {
    localStorage.removeItem('auth_token')
  },

  isAuthenticated: (): boolean => {
    return !!tokenManager.getToken()
  },
}
