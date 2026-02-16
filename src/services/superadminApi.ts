// Superadmin API Service
import { apiClient } from './api'

// Dashboard
export const superadminApi = {
  // Dashboard
  getDashboard: () => apiClient.get('/superadmin/dashboard'),

  // Companies Management
  getCompanies: () => apiClient.get('/superadmin/companies'),
  getCompany: (id: number) => apiClient.get(`/superadmin/companies/${id}`),
  createCompany: (data: any) => apiClient.post('/superadmin/companies', data),
  updateCompany: (id: number, data: any) => apiClient.put(`/superadmin/companies/${id}`, data),
  deleteCompany: (id: number) => apiClient.delete(`/superadmin/companies/${id}`),

  // Company Users Management
  getCompanyUsers: () => apiClient.get('/superadmin/company-users'),
  getCompanyUser: (id: number) => apiClient.get(`/superadmin/company-users/${id}`),
  createCompanyUser: (data: any) => apiClient.post('/superadmin/company-users', data),
  updateCompanyUser: (id: number, data: any) => apiClient.put(`/superadmin/company-users/${id}`, data),
  deleteCompanyUser: (id: number) => apiClient.delete(`/superadmin/company-users/${id}`),
  getUsersByRole: (role: string) => apiClient.get(`/superadmin/company-users/by-role/${role}`),

  // Customer Management
  getCustomers: () => apiClient.get('/superadmin/customers'),
  getCustomer: (id: number) => apiClient.get(`/superadmin/customers/${id}`),
  createCustomer: (data: any) => apiClient.post('/superadmin/customers', data),
  updateCustomer: (id: number, data: any) => apiClient.put(`/superadmin/customers/${id}`, data),
  deleteCustomer: (id: number) => apiClient.delete(`/superadmin/customers/${id}`),
  searchCustomers: (query: string) => apiClient.get(`/superadmin/customers/search?q=${query}`),

  // Parts Management
  getParts: () => apiClient.get('/superadmin/parts'),
  getPart: (id: number) => apiClient.get(`/superadmin/parts/${id}`),
  createPart: (data: any) => apiClient.post('/superadmin/parts', data),
  updatePart: (id: number, data: any) => apiClient.put(`/superadmin/parts/${id}`, data),
  deletePart: (id: number) => apiClient.delete(`/superadmin/parts/${id}`),
  searchParts: (description: string) => apiClient.get(`/superadmin/parts/search?description=${description}`),

  // Orders Management
  getOrders: () => apiClient.get('/superadmin/orders'),
  getOrder: (id: number) => apiClient.get(`/superadmin/orders/${id}`),
  createOrder: (data: any) => apiClient.post('/superadmin/orders', data),
  updateOrder: (id: number, data: any) => apiClient.put(`/superadmin/orders/${id}`, data),
  deleteOrder: (id: number) => apiClient.delete(`/superadmin/orders/${id}`),
  searchOrders: (poNo: string) => apiClient.get(`/superadmin/orders/search?po_no=${poNo}`),
  getOrdersByCustomer: (customerId: number) => apiClient.get(`/superadmin/orders/by-customer/${customerId}`),
  getOrdersByPart: (partId: number) => apiClient.get(`/superadmin/orders/by-part/${partId}`),

  // Delivery Challans Management
  getDeliveryChallans: () => apiClient.get('/superadmin/delivery-challans'),
  getDeliveryChallan: (id: number) => apiClient.get(`/superadmin/delivery-challans/${id}`),
  createDeliveryChallan: (data: any) => apiClient.post('/superadmin/delivery-challans', data),
  updateDeliveryChallan: (id: number, data: any) => apiClient.put(`/superadmin/delivery-challans/${id}`, data),
  deleteDeliveryChallan: (id: number) => apiClient.delete(`/superadmin/delivery-challans/${id}`),
  getDeliveryChallansByPart: (partId: number) => apiClient.get(`/superadmin/delivery-challans/by-part?part_id=${partId}`),

  // Authentication
  login: (credentials: { email: string; password: string }) => 
    apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
}
