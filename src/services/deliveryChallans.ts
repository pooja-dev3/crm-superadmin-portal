import { apiClient } from './api'
import type { ApiResponse } from '../types/api'

export interface DeliveryChallan {
  id: string
  challanNumber: string
  company: string
  orderId: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  createdDate: string
  deliveryDate?: string
  driverName?: string
  driverContactNumber?: string
}

export interface CreateDeliveryChallanRequest {
  challan_date: string
  to: string // Company/recipient name
  from: string
  part_id?: number | null
  part_no: string
  part_description: string
  hsn_code: string
  quantity: number
  unit_rate: string
  total: string
  notes?: string | null
  signature?: string | null
  customer_id?: number | null
  driver_name?: string
  driver_contact_number?: string
}

export interface UpdateDeliveryChallanRequest {
  challanNumber?: string
  company?: string
  orderId?: string
  status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  deliveryDate?: string
  driverName?: string
  driverContactNumber?: string
}

export interface PaginatedDeliveryChallansResponse {
  success: boolean
  message: string
  data: {
    data: DeliveryChallan[]
    current_page: number
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

export const deliveryChallanApi = {
  // Get all delivery challans
  getAllDeliveryChallans: async (): Promise<PaginatedDeliveryChallansResponse> => {
    return apiClient.get<PaginatedDeliveryChallansResponse>('/delivery-challans')
  },

  // Get delivery challan by ID
  getDeliveryChallanById: async (id: string): Promise<ApiResponse<DeliveryChallan>> => {
    return apiClient.get<ApiResponse<DeliveryChallan>>(`/delivery-challans/${id}`)
  },

  // Create a new delivery challan
  createDeliveryChallan: async (challanData: CreateDeliveryChallanRequest): Promise<ApiResponse<DeliveryChallan>> => {
    return apiClient.post<ApiResponse<DeliveryChallan>>('/delivery-challans', challanData)
  },

  // Update delivery challan
  updateDeliveryChallan: async (id: string, challanData: UpdateDeliveryChallanRequest): Promise<ApiResponse<DeliveryChallan>> => {
    return apiClient.put<ApiResponse<DeliveryChallan>>(`/delivery-challans/${id}`, challanData)
  },

  // Delete delivery challan
  deleteDeliveryChallan: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/delivery-challans/${id}`)
  },

  // Search delivery challans by challan number
  searchDeliveryChallans: async (challanNumber: string): Promise<PaginatedDeliveryChallansResponse> => {
    return apiClient.get<PaginatedDeliveryChallansResponse>(`/delivery-challans/search?challanNumber=${encodeURIComponent(challanNumber)}`)
  }
}
