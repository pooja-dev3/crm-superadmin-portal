import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Ban, CheckCircle, XCircle, Mail, Phone, MapPin, FileText, Calendar, Users, Package, FileText as DeliveryIcon, Settings } from 'lucide-react'
import { companyApi, customerApi } from '../services'
import { superadminApi } from '../services/superadminApi'
import { deliveryChallanApi, type DeliveryChallan } from '../services/deliveryChallans'
import { adminApi, type CreateAdminRequest } from '../services/admin'
import { ordersApi } from '../services/orders'
import { partApi } from '../services/parts'
import type { Company } from '../services/companies'
import type { Order, PartWithCustomer } from '../types/api'
import EditCompanyModal from '../components/EditCompanyModal'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  company_id: number
  created_at: string
}

// Use the real Order type from types/api.ts
// Use the real PartWithCustomer type from types/api.ts

interface CompanyFormData {
  comp_name: string
  email: string
  address: string
  phone: string
  gst_no: string
  is_active: boolean
}

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'orders' | 'challans' | 'parts' | 'supervisors' | 'operators'>('overview')
  
  // Additional data states - use correct types
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([])
  const [parts, setParts] = useState<PartWithCustomer[]>([])
  const [supervisors, setSupervisors] = useState<CreateAdminRequest[]>([])
  const [operators, setOperators] = useState<CreateAdminRequest[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCompany(id)
    }
  }, [id])

  const fetchCompany = async (companyId: string) => {
    try {
      const response = await companyApi.getCompanyById(parseInt(companyId))
      if (response.success) {
        setCompany(response.data)
        // Fetch additional data after company is loaded
        await fetchCompanyData(response.data)
      } else {
        setCompany(null)
      }
    } catch (error) {
      console.error('Error fetching company:', error)
      setCompany(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanyData = async (companyData: Company) => {
    try {
      setDataLoading(true)
      
      // Fetch all related data in parallel
      const [
        customersResponse,
        ordersResponse,
        challansResponse,
        partsResponse,
        adminsResponse
      ] = await Promise.all([
        customerApi.getAllCustomers(),
        ordersApi.getAllOrders(),
        superadminApi.getDeliveryChallans() as unknown as { success: boolean; data: any },
        partApi.getAllParts(),
        adminApi.getAllAdmins()
      ])

      // Filter data for this specific company
      if (customersResponse.success) {
        const customersData = Array.isArray(customersResponse.data) 
          ? customersResponse.data 
          : customersResponse.data?.data || []
        const companyCustomers = customersData.filter((cust: any) => 
          cust.comp_name === companyData.comp_name || cust.comp_name === companyData.comp_name
        )
        setCustomers(companyCustomers)
      }

      if (ordersResponse.success) {
        const ordersData = Array.isArray(ordersResponse.data) 
          ? ordersResponse.data 
          : ordersResponse.data?.data || []
        const companyOrders = ordersData.filter((order: any) => 
          order.customer?.comp_name === companyData.comp_name || 
          order.comp_name === companyData.comp_name
        )
        setOrders(companyOrders)
      }

      if (challansResponse.success) {
        const challansData = Array.isArray(challansResponse.data)
          ? challansResponse.data
          : challansResponse.data?.data || []
        const companyChallans = challansData.filter((challan: any) => 
          challan.comp_name === companyData.comp_name || 
          challan.to === companyData.comp_name ||
          challan.comp_name === companyData.comp_name
        )
        setDeliveryChallans(companyChallans)
      }

      if (partsResponse.success && partsResponse.data) {
        const partsData = Array.isArray(partsResponse.data) ? partsResponse.data : []
        const companyParts = partsData.filter((part: PartWithCustomer) => 
          part.customer?.name === companyData.comp_name
        )
        setParts(companyParts)
      }

      if (adminsResponse.success) {
        const adminsData = Array.isArray(adminsResponse.data) 
          ? adminsResponse.data 
          : adminsResponse.data?.data || []
        
        // Filter by role and company
        const companySupervisors = adminsData.filter((admin: any) => 
          admin.company === companyData.comp_name && (admin.role === 'supervisor' || admin.role === 'manager')
        )
        const companyOperators = adminsData.filter((admin: any) => 
          admin.company === companyData.comp_name && admin.role === 'operator'
        )
        
        setSupervisors(companySupervisors)
        setOperators(companyOperators)
      }

    } catch (error) {
      console.error('Error fetching company data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  // Render functions for different tabs
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Company Info Card */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="bg-blue-900 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{company?.comp_name || ''}</h2>
              <div className="flex items-center mt-2">
                {company?.is_active ? (
                  <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-4 h-4 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Company Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{company?.email || ''}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{company?.phone || ''}</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-600">{company?.address || 'No address provided'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">GST Number</p>
                <p className="text-sm text-gray-600">{company?.gst_no || ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Delivery Challans</h3>
          <p className="text-2xl font-bold text-gray-900">{deliveryChallans.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Staff</h3>
          <p className="text-2xl font-bold text-gray-900">{supervisors.length + operators.length}</p>
        </div>
      </div>
    </div>
  )

  const renderCustomers = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Customers ({customers.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{customer.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No customers found for this company</div>
        )}
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Orders ({orders.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.po_no}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customer?.name || `Customer ${order.customer_id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.part?.part_description || `Part ${order.part_id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.po_qty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.po_received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.po_received ? 'Received' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.po_date ? new Date(order.po_date).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">No orders found for this company</div>
        )}
      </div>
    </div>
  )

  const renderDeliveryChallans = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Delivery Challans ({deliveryChallans.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deliveryChallans.map((challan) => (
              <tr key={challan.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{challan.challanNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{challan.company}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{challan.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(challan.createdDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    challan.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                    challan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {challan.status || 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deliveryChallans.length === 0 && (
          <div className="text-center py-8 text-gray-500">No delivery challans found for this company</div>
        )}
      </div>
    </div>
  )

  const renderParts = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Parts ({parts.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawing No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rev No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Wt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thickness</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parts.map((part) => (
              <tr key={part.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.drawing_no}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{part.part_description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.rev_no || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.net_wt || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.thickness || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.raw_material || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.lead_time || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {parts.length === 0 && (
          <div className="text-center py-8 text-gray-500">No parts found for this company</div>
        )}
      </div>
    </div>
  )

  const renderSupervisors = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Supervisors ({supervisors.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {supervisors.map((supervisor) => (
              <tr key={supervisor.email}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supervisor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supervisor.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supervisor.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supervisor.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    supervisor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {supervisor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {supervisors.length === 0 && (
          <div className="text-center py-8 text-gray-500">No supervisors found for this company</div>
        )}
      </div>
    </div>
  )

  const renderOperators = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Operators ({operators.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operators.map((operator) => (
              <tr key={operator.email}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{operator.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{operator.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{operator.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{operator.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    operator.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {operator.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {operators.length === 0 && (
          <div className="text-center py-8 text-gray-500">No operators found for this company</div>
        )}
      </div>
    </div>
  )

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleEditSubmit = async (companyData: CompanyFormData) => {
    if (!company) return
    
    try {
      const response = await companyApi.updateCompany(company.id, {
        comp_name: companyData.comp_name,
        email: companyData.email,
        address: companyData.address,
        phno: companyData.phone,
        gst: companyData.gst_no,
        status: companyData.is_active ? 'active' : 'inactive'
      })
      
      if (response.success) {
        setShowEditModal(false)
        // Refresh company data
        await fetchCompany(company.id.toString())
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Failed to update company')
    }
  }

  const handleToggleStatus = async () => {
    if (!company) return
    
    const confirmMessage = company.is_active 
      ? `Are you sure you want to deactivate "${company.comp_name}"?`
      : `Are you sure you want to activate "${company.comp_name}"?`
    
    if (confirm(confirmMessage)) {
      try {
        const response = await companyApi.toggleCompanyStatus(company.id)
        if (response.success) {
          // Refresh company data
          await fetchCompany(company.id.toString())
        }
      } catch (error) {
        console.error('Error updating company status:', error)
        alert('Failed to update company status')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company not found</h2>
          <button
            onClick={() => navigate('/companies')}
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
          >
            Back to Companies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/companies')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Companies
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Company Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleToggleStatus}
                className={`flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  company.is_active
                    ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                    : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                }`}
              >
                {company.is_active ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'orders', label: 'Orders', icon: Package },
                { id: 'challans', label: 'Delivery Challans', icon: DeliveryIcon },
                { id: 'parts', label: 'Parts', icon: Settings },
                { id: 'supervisors', label: 'Supervisors', icon: Users },
                { id: 'operators', label: 'Operators', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'customers' && renderCustomers()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'challans' && renderDeliveryChallans()}
            {activeTab === 'parts' && renderParts()}
            {activeTab === 'supervisors' && renderSupervisors()}
            {activeTab === 'operators' && renderOperators()}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditCompanyModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          company={company}
        />
      )}
    </div>
  )
}

export default CompanyDetail
