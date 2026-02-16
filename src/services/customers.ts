import { apiClient } from './api'
import type { ApiResponse } from '../types/api'

export interface Customer {
  id: number
  name: string
  address: string
  contact_no: string
  gst_no: string
  comp_code: string
  comp_name: string
  is_active: boolean
  parts_count: number
  parts: any[]
  created_at: string
  updated_at: string
}

export interface CreateCustomerRequest {
  name: string
  address: string
  contact_no: string
  gst_no: string
  comp_code: string
  comp_name: string
}

export interface UpdateCustomerRequest {
  name?: string
  address?: string
  contact_no?: string
  gst_no?: string
  comp_code?: string
  comp_name?: string
  is_active?: boolean
}

export interface PaginatedCustomersResponse {
  success: boolean
  message: string
  data: {
    current_page: number
    data: Customer[]
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

export const customerApi = {
  // Get all customers
  getAllCustomers: async (): Promise<PaginatedCustomersResponse> => {
    return apiClient.get<PaginatedCustomersResponse>('/customers')
  },

  // Get customer by ID
  getCustomerById: async (id: number): Promise<ApiResponse<Customer>> => {
    return apiClient.get<ApiResponse<Customer>>(`/customers/${id}`)
  },

  // Create a new customer
  createCustomer: async (customerData: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    return apiClient.post<ApiResponse<Customer>>('/customers', customerData)
  },

  // Update customer
  updateCustomer: async (id: number, customerData: UpdateCustomerRequest): Promise<ApiResponse<Customer>> => {
    return apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, customerData)
  },

  // Toggle customer status
  toggleCustomerStatus: async (id: number): Promise<ApiResponse<Customer>> => {
    return apiClient.patch<ApiResponse<Customer>>(`/customers/${id}/toggle-status`)
  },

  // Delete customer
  deleteCustomer: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/customers/${id}`)
  },

  // Search customers by name
  searchCustomers: async (name: string): Promise<PaginatedCustomersResponse> => {
    return apiClient.get<PaginatedCustomersResponse>(`/customers?search=${encodeURIComponent(name)}`)
  },
}
