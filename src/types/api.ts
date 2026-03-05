// TypeScript interfaces for API responses

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'user' | 'superadmin'
}

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: User
  role: string
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

export interface Company {
  id: number
  comp_name: string
  email: string
  address: string
  phone: string
  gst_no: string
  code: string
  is_active: boolean
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

export interface DeliveryChallan {
  id: string
  challanNumber: string
  company: string
  orderId: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  createdDate: string
  deliveryDate?: string
}

export interface CreateCustomerRequest {
  name: string
  email: string
  address: string
  contact_no: string
  gst_no: string
}

export interface CreatePartRequest {
  customer_id: number
  part_description: string
  drawing_no: string
  rev_no: string
  net_wt: number
  thickness: number
  tool_information: string
  raw_material: string
  drawing_location: string
  operation_sequence: string
  lead_time: number
  po_no: string
  po_date: string
  po_received: boolean
  po_qty: number
  po_drg_rev: string
  acknowledgement_remarks: string
  reqd_date_as_per_po: string
  comp_name: string
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

export interface Order {
  id: number
  customer_id: number
  part_id: number
  po_no: string
  po_date: string
  po_received: boolean
  po_qty: number
  po_drg_rev: string
  acknowledgement_remarks: string
  reqd_date_as_per_po: string
  dispatch_details_inv_date: string
  dispatch_details_inv_no: string
  dispatch_details_inv_qlt: number
  balance_qty: number
  balance_as_per_hitachi: number
  price: string
  fg_stock: number
  wip_stock: number
  comp_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  customer: {
    id: number
    name: string
    email: string
    address: string
    contact_no: string
    gst_no: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  part: {
    id: number
    customer_id: number
    part_description: string
    drawing_no: string
    rev_no: string
    net_wt: string
    thickness: string
    tool_information: string
    raw_material: string
    drawing_location: string
    operation_sequence: string
    lead_time: number
    is_active: boolean
    created_at: string
    updated_at: string
  }
}

export interface CreateOrderRequest {
  customer_id: number
  part_id: number
  po_no: string
  po_date: string
  po_received: boolean
  po_qty: number
  po_drg_rev: string
  acknowledgement_remarks: string
  reqd_date_as_per_po: string
  dispatch_details_inv_date: string
  dispatch_details_inv_no: string
  dispatch_details_inv_qlt: number
  balance_qty: number
  balance_as_per_hitachi: number
  price: string
  fg_stock: number
  wip_stock: number
  comp_name: string
}

export interface OrderDisplay {
  id: string
  orderNumber: string
  company: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total: number
  createdDate: string
  poQty: number
  balanceQty: number
  price: string
  fgStock: number
  wipStock: number
  partDescription: string
  drawingNo: string
  reqdDate: string
  dispatchDate: string
  invNo: string
  originalOrder: Order
}

export interface DashboardStats {
  totalCompanies: number
  totalCompanyUsers: number
  totalCustomers: number
  totalParts: number
  totalOrders: number
  totalDeliveryChallans: number
  systemHealth?: number
  activeUsers?: number
  roleSummary?: RoleSummary
}

export interface RoleSummary {
  superadmin: number
  admin: number
  supervisor: number
  operator: number
}

export interface DashboardData {
  companies: any[]
  company_users: any[]
  customers: any[]
  parts: any[]
  orders: any[]
  delivery_challans: any[]
  summary: {
    total_companies: number
    total_company_users: number
    total_customers: number
    total_parts: number
    total_orders: number
    total_delivery_challans: number
  }
  role_summary: RoleSummary
}

export interface DashboardResponse {
  success: boolean
  message: string
  data: DashboardData
}

export interface RecentActivity {
  id: string
  type: 'company' | 'order' | 'customer' | 'part' | 'admin'
  title: string
  description: string
  time: string
  status: string
  icon: string
  color: string
  amount?: string
}
