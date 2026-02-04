// TypeScript interfaces for API responses

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'user'
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface CurrentUserResponse {
  success: boolean
  data: User
  message?: string
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export interface RoleAccessResponse {
  message: string
}

export interface Customer {
  id: number
  name: string
  address: string
  contact_no: string
  gst_no: string
  created_at: string
  updated_at: string
}

export interface Part {
  id: number
  customer_id: number
  part_description: string
  drawing_no: string
  rev_no?: string
  net_wt?: string
  thickness?: string
  tool_information?: string
  raw_material?: string
  drawing_location?: string
  operation_sequence?: string
  lead_time?: number
  po_no?: string
  po_date?: string
  po_received?: boolean
  po_qty?: number
  po_drg_rev?: string
  acknowledgement_remarks?: string
  reqd_date_as_per_po?: string
  created_at: string
  updated_at: string
}

export interface CustomerWithParts extends Customer {
  parts: Part[]
}

export interface PartWithCustomer extends Part {
  customer: Customer
}

export interface CreateCustomerRequest {
  name: string
  address: string
  contact_no: string
  gst_no: string
}

export interface CreatePartRequest {
  customer_id: number
  part_description: string
  drawing_no: string
  rev_no?: string
  net_wt?: number
  thickness?: string
  tool_information?: string
  raw_material?: string
  drawing_location?: string
  operation_sequence?: string
  lead_time?: number
  po_no?: string
  po_date?: string
  po_received?: boolean
  po_qty?: number
  po_drg_rev?: string
  acknowledgement_remarks?: string
  reqd_date_as_per_po?: string
}

export interface SearchCustomersResponse {
  success: boolean
  data: CustomerWithParts[]
  count: number
}

export interface SearchPartsResponse {
  success: boolean
  data: PartWithCustomer[]
  count: number
}
