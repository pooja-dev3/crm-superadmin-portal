import { apiClient } from './api'
import type { ApiResponse } from '../types/api'

export interface Company {
  id: number
  comp_name: string
  email: string
  address: string
  phone: string
  gst_no: string
  code: string
  phno: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCompanyRequest {
  comp_name: string
  email: string
  address: string
  phno: string
  gst: string
  status: 'active' | 'inactive'
}

export interface UpdateCompanyRequest {
  comp_name: string
  email: string
  address: string
  phno: string
  gst: string
  status: 'active' | 'inactive'
}

export interface PaginatedCompaniesResponse {
  success: boolean
  message: string
  data: {
    current_page: number
    data: Company[]
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

export const companyApi = {
  // Get all companies
  getAllCompanies: async (): Promise<PaginatedCompaniesResponse> => {
    return apiClient.get<PaginatedCompaniesResponse>('/companies')
  },

  // Get company by ID
  getCompanyById: async (id: number): Promise<ApiResponse<Company>> => {
    return apiClient.get<ApiResponse<Company>>(`/companies/${id}`)
  },

  // Create a new company
  createCompany: async (companyData: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
    return apiClient.post<ApiResponse<Company>>('/companies', companyData)
  },

  // Update company
  updateCompany: async (id: number, companyData: UpdateCompanyRequest): Promise<ApiResponse<Company>> => {
    return apiClient.put<ApiResponse<Company>>(`/companies/${id}`, companyData)
  },

  // Toggle company status
  toggleCompanyStatus: async (id: number): Promise<ApiResponse<Company>> => {
    return apiClient.patch<ApiResponse<Company>>(`/companies/${id}/toggle-status`)
  },

  // Delete company
  deleteCompany: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/companies/${id}`)
  },
}
