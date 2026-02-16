import { apiClient } from './api'
import type {
  ApiResponse,
  PartWithCustomer,
  CreatePartRequest,
  SearchPartsResponse,
} from '../types/api'

export const partApi = {
  // Get all parts with customer information
  getAllParts: async (): Promise<ApiResponse<PartWithCustomer[]>> => {
    return apiClient.get<ApiResponse<PartWithCustomer[]>>('/parts')
  },

  // Create a new part
  createPart: async (partData: CreatePartRequest): Promise<ApiResponse<PartWithCustomer>> => {
    return apiClient.post<ApiResponse<PartWithCustomer>>('/parts', partData)
  },

  // Update a part
  updatePart: async (id: number, partData: CreatePartRequest): Promise<ApiResponse<PartWithCustomer>> => {
    return apiClient.put<ApiResponse<PartWithCustomer>>(`/parts/${id}`, partData)
  },

  // Delete a part
  deletePart: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/parts/${id}`)
  },

  // Search parts by description (partial match)
  searchParts: async (description: string): Promise<SearchPartsResponse> => {
    return apiClient.get<SearchPartsResponse>(`/parts/search?description=${encodeURIComponent(description)}`)
  },
}
