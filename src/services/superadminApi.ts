// Superadmin API Service
import { apiClient } from './api'
import type {
  ApiResponse,
  DashboardResponse,
  RecentActivity,
  Customer,
  CreateCustomerRequest,
  Part,
  CreatePartRequest,
  Order,
  CreateOrderRequest,
  LoginResponse,
  User
} from '../types/api'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest, PaginatedCompaniesResponse } from './companies'
import type { Admin, CreateAdminRequest, UpdateAdminRequest, PaginatedAdminsResponse } from './admin'
import type { PaginatedDeliveryChallansResponse, DeliveryChallan, CreateDeliveryChallanRequest, UpdateDeliveryChallanRequest } from './deliveryChallans'

// Dashboard
export const superadminApi = {
  // Dashboard
  getDashboard: () => apiClient.get<DashboardResponse>('/superadmin/dashboard'),
  getRecentActivities: () => apiClient.get<ApiResponse<RecentActivity[]>>('/superadmin/recent-activities'),

  // Companies Management
  getCompanies: () => apiClient.get<PaginatedCompaniesResponse>('/superadmin/companies'),
  getCompany: (id: number) => apiClient.get<ApiResponse<Company>>(`/superadmin/companies/${id}`),
  createCompany: (data: CreateCompanyRequest) => apiClient.post<ApiResponse<Company>>('/superadmin/companies', data),
  updateCompany: (id: number, data: UpdateCompanyRequest) => apiClient.put<ApiResponse<Company>>(`/superadmin/companies/${id}`, data),
  deleteCompany: (id: number) => apiClient.delete<ApiResponse<void>>(`/superadmin/companies/${id}`),

  // Company Users Management
  getCompanyUsers: () => apiClient.get<PaginatedAdminsResponse>('/superadmin/company-users'),
  getCompanyUser: (id: number) => apiClient.get<ApiResponse<Admin>>(`/superadmin/company-users/${id}`),
  createCompanyUser: (data: CreateAdminRequest) => apiClient.post<ApiResponse<Admin>>('/superadmin/company-users', data),
  updateCompanyUser: (id: number, data: UpdateAdminRequest) => apiClient.put<ApiResponse<Admin>>(`/superadmin/company-users/${id}`, data),
  deleteCompanyUser: (id: number) => apiClient.delete<ApiResponse<void>>(`/superadmin/company-users/${id}`),
  getUsersByRole: (role: string) => apiClient.get<ApiResponse<Admin[]>>(`/superadmin/company-users/by-role/${role}`),

  // Customer Management
  getCustomers: () => apiClient.get<ApiResponse<Customer[]>>('/superadmin/customers'),
  getCustomer: (id: number) => apiClient.get<ApiResponse<Customer>>(`/superadmin/customers/${id}`),
  createCustomer: (data: CreateCustomerRequest) => apiClient.post<ApiResponse<Customer>>('/superadmin/customers', data),
  updateCustomer: (id: number, data: Partial<CreateCustomerRequest>) => apiClient.put<ApiResponse<Customer>>(`/superadmin/customers/${id}`, data),
  deleteCustomer: (id: number) => apiClient.delete<ApiResponse<void>>(`/superadmin/customers/${id}`),
  searchCustomers: (query: string) => apiClient.get<ApiResponse<Customer[]>>(`/superadmin/customers/search?q=${query}`),

  // Parts Management
  getParts: () => apiClient.get<ApiResponse<Part[]>>('/superadmin/parts'),
  getPart: (id: number) => apiClient.get<ApiResponse<Part>>(`/superadmin/parts/${id}`),
  createPart: (data: CreatePartRequest) => apiClient.post<ApiResponse<Part>>('/superadmin/parts', data),
  updatePart: (id: number, data: Partial<CreatePartRequest>) => apiClient.put<ApiResponse<Part>>(`/superadmin/parts/${id}`, data),
  deletePart: (id: number) => apiClient.delete<ApiResponse<void>>(`/superadmin/parts/${id}`),
  searchParts: (description: string) => apiClient.get<ApiResponse<Part[]>>(`/superadmin/parts/search?description=${description}`),

  // Orders Management
  getOrders: () => apiClient.get<ApiResponse<Order[]>>('/superadmin/orders'),
  getOrder: (id: number) => apiClient.get<ApiResponse<Order>>(`/superadmin/orders/${id}`),
  createOrder: (data: CreateOrderRequest) => apiClient.post<ApiResponse<Order>>('/superadmin/orders', data),
  updateOrder: (id: number, data: Partial<CreateOrderRequest>) => apiClient.put<ApiResponse<Order>>(`/superadmin/orders/${id}`, data),
  deleteOrder: (id: number) => apiClient.delete<ApiResponse<void>>(`/superadmin/orders/${id}`),
  searchOrders: (poNo: string) => apiClient.get<ApiResponse<Order[]>>(`/superadmin/orders/search?po_no=${poNo}`),
  getOrdersByCustomer: (customerId: number) => apiClient.get<ApiResponse<Order[]>>(`/superadmin/orders/by-customer/${customerId}`),
  getOrdersByPart: (partId: number) => apiClient.get<ApiResponse<Order[]>>(`/superadmin/orders/by-part/${partId}`),

  // Delivery Challans Management
  getDeliveryChallans: (page: number = 1) => apiClient.get<PaginatedDeliveryChallansResponse>(`/superadmin/delivery-challans?page=${page}`),
  getDeliveryChallan: (id: number) => apiClient.get<ApiResponse<DeliveryChallan>>(`/superadmin/delivery-challans/${id}`),
  createDeliveryChallan: (data: CreateDeliveryChallanRequest) => apiClient.post<ApiResponse<DeliveryChallan>>('/superadmin/delivery-challans', data),
  updateDeliveryChallan: (id: number, data: UpdateDeliveryChallanRequest) => apiClient.put<ApiResponse<DeliveryChallan>>(`/superadmin/delivery-challans/${id}`, data),
  deleteDeliveryChallan: (id: number) => apiClient.delete<ApiResponse<void>>(`/superadmin/delivery-challans/${id}`),
  getDeliveryChallansByPart: (partId: number) => apiClient.get<ApiResponse<DeliveryChallan[]>>(`/superadmin/delivery-challans/by-part?part_id=${partId}`),

  // Authentication
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<LoginResponse>('/auth/login', credentials),
  getMe: () => apiClient.get<ApiResponse<User>>('/auth/me'),
  logout: () => apiClient.post<ApiResponse<void>>('/auth/logout'),

  // Roles Management
  getRoles: () => apiClient.get<ApiResponse<string[]>>('/superadmin/roles'),

  // Permissions Management
  getPermissions: () => apiClient.get<ApiResponse<any[]>>('/superadmin/permissions'),

  // Security Settings
  getSecuritySettings: () => apiClient.get<ApiResponse<any>>('/superadmin/settings/security'),
  updateSecuritySettings: (data: any) => apiClient.put<ApiResponse<any>>('/superadmin/settings/security', data),
}
