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
  // New fields for Edit form compatibility
  customer?: {
    id: number
    name: string
    address?: string
    contact_no?: string
    gst_no?: string
    comp_code?: string
  }
  to?: string
  from?: string
  part?: {
    id: number
    part_description: string
    drawing_no?: string
    rev_no?: string
    net_wt?: string
    thickness?: string
    tool_information?: string
    raw_material?: string
    drawing_location?: string
    operation_sequence?: string
    lead_time?: number
  }
  partDescription?: string
  hsnCode?: string
  quantity?: number
  unitRate?: string
  total?: string
  notes?: string | null
  signature?: string | null
  // Additional fields for Edit form
  challan_no?: string
  comp_name?: string
  customer_id?: number | null
  challan_date?: string
  part_id?: number | null
  part_no?: string
  hsn_code?: string
  unit_rate?: string
}

export interface CreateDeliveryChallanRequest {
  challan_no: string
  comp_name: string
  customer_id: number | null
  challan_date: string
  to: string
  from: string
  part_id: number | null
  part_no: string
  part_description: string
  hsn_code: string
  quantity: number
  unit_rate: string
  total: string
  notes: string | null
  signature: string | null
}

export interface UpdateDeliveryChallanRequest {
  challan_no?: string
  comp_name?: string
  customer_id?: number | null
  challan_date?: string
  to?: string
  from?: string
  part_id?: number | null
  part_no?: string
  part_description?: string
  hsn_code?: string
  quantity?: number
  unit_rate?: string
  total?: string
  notes?: string | null
  signature?: string | null
  status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
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
