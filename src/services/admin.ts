import { apiClient } from './api'
import type { ApiResponse } from '../types/api'

export interface Admin {
  id: number
  name: string
  email: string
  phone: string
  department: string
  role: string
  company_name?: string
  company_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateAdminRequest {
  name: string
  email: string
  phone: string
  role: string
  company: string
  company_code: string
  password: string
  password_confirmation: string
  is_active?: boolean
}

export interface UpdateAdminRequest {
  name?: string
  email?: string
  phone?: string
  department?: string
  role?: string
  is_active?: boolean
}

export interface PaginatedAdminsResponse {
  success: boolean
  message: string
  data: {
    current_page: number
    data: Admin[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    links: Array<{
      url: string | null
      label: string
      page: number | null
      active: boolean
    }>
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
  }
}

export const adminApi = {
  // Get all company users
  getAllAdmins: async (): Promise<PaginatedAdminsResponse> => {
    return apiClient.get<PaginatedAdminsResponse>('/company-users')
  },

  // Get admin by ID
  getAdminById: async (id: number): Promise<ApiResponse<Admin>> => {
    return apiClient.get<ApiResponse<Admin>>(`/company-users/${id}`)
  },

  // Create a new admin
  createAdmin: async (adminData: CreateAdminRequest): Promise<ApiResponse<Admin>> => {
    return apiClient.post<ApiResponse<Admin>>('/company-users', adminData)
  },

  // Update admin
  updateAdmin: async (id: number, adminData: UpdateAdminRequest): Promise<ApiResponse<Admin>> => {
    return apiClient.put<ApiResponse<Admin>>(`/company-users/${id}`, adminData)
  },

  // Toggle admin status
  toggleAdminStatus: async (id: number): Promise<ApiResponse<Admin>> => {
    return apiClient.patch<ApiResponse<Admin>>(`/company-users/${id}/toggle-status`)
  },

  // Delete admin
  deleteAdmin: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/company-users/${id}`)
  },

  // Reset admin password
  resetPassword: async (id: number, newPassword: string): Promise<ApiResponse<void>> => {
    return apiClient.post<ApiResponse<void>>(`/company-users/${id}/reset-password`, { password: newPassword })
  },
}
