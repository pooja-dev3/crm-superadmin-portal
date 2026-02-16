import { apiClient } from './api'
import type { ApiResponse, Order, CreateOrderRequest } from '../types/api'

export interface PaginatedOrdersResponse {
  success: boolean
  message: string
  data: {
    data: Order[]
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

export const ordersApi = {
  // Get all orders
  getAllOrders: async (): Promise<PaginatedOrdersResponse> => {
    // Add cache-busting parameter
    const timestamp = Date.now()
    return apiClient.get<PaginatedOrdersResponse>(`/orders?t=${timestamp}`)
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    return apiClient.get<ApiResponse<Order>>(`/orders/${id}`)
  },

  // Create a new order
  createOrder: async (orderData: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiClient.post<ApiResponse<Order>>('/orders', orderData)
  },

  // Update an existing order
  updateOrder: async (id: string, orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    return apiClient.put<ApiResponse<Order>>(`/orders/${id}`, orderData)
  },

  // Delete an order
  deleteOrder: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/orders/${id}`)
  },

  // Search orders by company
  searchOrdersByCompany: async (company: string): Promise<PaginatedOrdersResponse> => {
    return apiClient.get<PaginatedOrdersResponse>(`/orders/search?company=${encodeURIComponent(company)}`)
  }
}
