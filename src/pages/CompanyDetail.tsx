import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Ban, CheckCircle, XCircle, Mail, Phone, MapPin, FileText, Calendar, Users, Package, FileText as DeliveryIcon, Settings, Building, Tag } from 'lucide-react'
import { companyApi, customerApi, deliveryChallanApi, adminApi, ordersApi, partApi } from '../services'
import type { Company } from '../services/companies'
import type { Order, PartWithCustomer, DeliveryChallan } from '../types/api'
import type { Admin } from '../services/admin'
import type { Customer } from '../services/customers'
import EditCompanyModal from '../components/EditCompanyModal'
import { useToast } from '../contexts/ToastContext'

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
  const { addToast } = useToast()

  // Additional data states - use correct types
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([])
  const [parts, setParts] = useState<PartWithCustomer[]>([])
  const [supervisors, setSupervisors] = useState<Admin[]>([])
  const [operators, setOperators] = useState<Admin[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [companyStatus, setCompanyStatus] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (id) {
      fetchCompany(id)
    }
  }, [id])

  const fetchCompany = async (companyId: string) => {
    try {
      const response = await companyApi.getCompanyById(parseInt(companyId))
      console.log('Company API Response:', response)
      if (response.success) {
        console.log('Company Data:', response.data)
        // Handle both direct and nested company data structures
        const companyData = (response.data as any)?.company || response.data
        console.log('Processed Company Data:', companyData)
        // Extract status from nested company object if available, otherwise use direct field
        const companyStatus = companyData?.status === 'active' || companyData?.is_active === true
        console.log('Company Status:', companyStatus)
        console.log('Final Status Value:', companyStatus)
        console.log('Company Status Type:', typeof companyStatus)
        setCompany(companyData)
        // Force a small delay to ensure state is set
        await new Promise(resolve => setTimeout(resolve, 100))
        // Fetch additional data after company is loaded
        await fetchCompanyData(companyData)
      } else {
        console.error('Company API Error:', response)
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
        deliveryChallanApi.getAllDeliveryChallans(),
        partApi.getAllParts(),
        adminApi.getAllAdmins()
      ])

      // Filter data for this specific company
      if (customersResponse.success) {
        const customersData = Array.isArray(customersResponse.data)
          ? customersResponse.data
          : customersResponse.data?.data || []
        const companyCustomers = customersData.filter((cust: Customer) =>
          cust.comp_name === companyData.comp_name
        )
        setCustomers(companyCustomers)
      }

      if (ordersResponse.success) {
        const ordersData = Array.isArray(ordersResponse.data)
          ? ordersResponse.data
          : ordersResponse.data?.data || []
        const companyOrders = ordersData.filter((order: Order) =>
          order.customer?.name === companyData.comp_name ||
          order.comp_name === companyData.comp_name
        )
        setOrders(companyOrders)
      }

      if (challansResponse.success) {
        const challansData = Array.isArray(challansResponse.data)
          ? challansResponse.data
          : challansResponse.data?.data || []
        const companyChallans = challansData.filter((challan: DeliveryChallan) =>
          (challan as any).comp_name === companyData.comp_name ||
          (challan as any).to === companyData.comp_name ||
          challan.company === companyData.comp_name
        )
        setDeliveryChallans(companyChallans)
      }

      if (partsResponse.success && partsResponse.data) {
        const partsData = Array.isArray(partsResponse.data) ? partsResponse.data : []

        // Get the IDs of customers that belong to this company
        let companyCustomerIds: number[] = []

        if (customersResponse.success) {
          const allCustomers = Array.isArray(customersResponse.data)
            ? customersResponse.data
            : customersResponse.data?.data || []
          // Customers belonging to this company
          const companyCustomers = allCustomers.filter((cust: Customer) =>
            cust.comp_name === companyData.comp_name
          )
          companyCustomerIds = companyCustomers.map((c: Customer) => c.id)
        }

        console.log('Company customer IDs for parts filtering:', companyCustomerIds)

        // Filter parts: match by customer_id in company's customer list, or by direct comp_name field
        const companyParts = partsData.filter((part: PartWithCustomer) => {
          // Match by customer_id (most reliable)
          if (companyCustomerIds.length > 0 && companyCustomerIds.includes(part.customer_id)) {
            return true
          }
          // Match by nested customer name (if API returns it)
          if (part.customer?.name === companyData.comp_name) {
            return true
          }
          // Match by direct company field
          if (
            (part as any).comp_name === companyData.comp_name ||
            (part as any).company_name === companyData.comp_name
          ) {
            return true
          }
          return false
        })

        console.log('Filtered parts count for company:', companyParts.length)
        setParts(companyParts)
      } else {
        console.log('Parts API response failed or no data')
      }

      if (adminsResponse.success) {
        const adminsData = Array.isArray(adminsResponse.data)
          ? adminsResponse.data
          : adminsResponse.data?.data || []

        console.log('All admins data:', adminsData)
        console.log('Company name:', companyData.comp_name)

        // Try multiple possible company fields for admins
        const companySupervisors = adminsData.filter((admin: Admin) => {
          const adminCompany =
            admin.company_name ||
            (admin as any).comp_name ||
            (admin as any).company ||
            (admin as any).assigned_company

          return adminCompany === companyData.comp_name &&
            (admin.role === 'supervisor' || admin.role === 'manager')
        })

        const companyOperators = adminsData.filter((admin: Admin) => {
          const adminCompany =
            admin.company_name ||
            (admin as any).comp_name ||
            (admin as any).company ||
            (admin as any).assigned_company

          return adminCompany === companyData.comp_name &&
            admin.role === 'operator'
        })

        console.log('Filtered supervisors:', companySupervisors)
        console.log('Filtered operators:', companyOperators)

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
      <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl animate-fade-in-scale">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 sm:px-10 py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10 gap-4">
            <div className="flex items-center space-x-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                <Building className="h-8 w-8 text-white drop-shadow" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{company?.comp_name || ''}</h2>
                <div className="flex items-center mt-2.5 space-x-3">
                  {(() => {
                    const status = (company as any)?.status === 'active' || company?.is_active === true;
                    return status;
                  })() ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-100 border border-rose-500/30 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-rose-500/20">
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Inactive
                    </span>
                  )}
                  <span className="text-blue-100 text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 border border-white/10 backdrop-blur-sm">ID: {company?.id}</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all border border-white/20 backdrop-blur-sm shadow-sm hover:shadow active:scale-95"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-8">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center">
            <Tag className="w-3.5 h-3.5 mr-2" />
            Contact & Registration Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div className="flex items-start group">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-semibold text-gray-900">{company?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-green-100 transition-all">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-sm font-semibold text-gray-900">{company?.phone || (company as any)?.phno || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-purple-100 transition-all">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">GST Number</p>
                <p className="text-sm font-mono font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 mt-1 inline-block">{company?.gst_no || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered Address</p>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">{company?.address || 'No address provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Customers', value: customers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Delivery Challans', value: deliveryChallans.length, icon: DeliveryIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Staff', value: supervisors.length + operators.length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-black/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{stat.label}</h3>
                <p className="text-3xl font-extrabold text-gray-900 group-hover:text-blue-900 transition-colors">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCustomers = () => (
    <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" /> Customers
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{customers.length}</span>
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar relative max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Address</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{customer.contact_no}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{customer.address}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600">{customer.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No customers found for this company</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" /> Orders
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{orders.length}</span>
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar relative max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">PO No</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Part</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Quantity</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Price</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{order.po_no}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                  {order.customer?.name || `Customer ${order.customer_id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs tracking-wider border border-gray-200">
                    {order.part?.part_description || `Part ${order.part_id}`}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{order.po_qty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">₹{order.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${order.po_received ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                    {order.po_received ? 'Received' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                  {order.po_date ? new Date(order.po_date).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No orders found for this company</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderDeliveryChallans = () => (
    <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <DeliveryIcon className="h-5 w-5 mr-2 text-blue-600" /> Delivery Challans
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{deliveryChallans.length}</span>
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar relative max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Challan No</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">To</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Part Description</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {deliveryChallans.map((challan) => (
              <tr key={challan.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{(challan as any).challan_no || challan.challanNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{(challan as any).to || (challan as any).comp_name || challan.company}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs tracking-wider border border-gray-200">
                    {(challan as any).part_no || (challan as any).part?.part_description || (challan as any).partDescription || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                  {new Date((challan as any).challan_date || challan.createdDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${challan.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    challan.status === 'in_transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      challan.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                    {challan.status ? challan.status.replace('_', ' ').charAt(0).toUpperCase() + challan.status.replace('_', ' ').slice(1) : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deliveryChallans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50">
            <DeliveryIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No delivery challans found for this company</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderParts = () => (
    <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-blue-600" /> Parts
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{parts.length}</span>
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar relative max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Drawing No</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Description</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Rev No</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Net Wt</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Thickness</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Material</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Lead Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {parts.map((part) => (
              <tr key={part.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{part.drawing_no}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600">{part.part_description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                  {part.rev_no ? <span className="bg-gray-100 px-2 py-1 rounded text-xs tracking-wider border border-gray-200">{part.rev_no}</span> : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{part.net_wt || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{part.thickness || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{part.raw_material || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{part.lead_time || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {parts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50">
            <Settings className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No parts found for this company</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderSupervisors = () => (
    <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" /> Supervisors
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{supervisors.length}</span>
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar relative max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {supervisors.map((supervisor) => (
              <tr key={supervisor.email} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{supervisor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{supervisor.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{supervisor.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-bold tracking-wider border border-blue-200">
                    {supervisor.role.charAt(0).toUpperCase() + supervisor.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${supervisor.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                    {supervisor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {supervisors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No supervisors found for this company</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderOperators = () => (
    <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" /> Operators
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{operators.length}</span>
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar relative max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {operators.map((operator) => (
              <tr key={operator.email} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{operator.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{operator.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{operator.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-bold tracking-wider border border-blue-200">
                    {operator.role.charAt(0).toUpperCase() + operator.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${operator.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                    {operator.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {operators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No operators found for this company</p>
          </div>
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
        addToast('Company updated successfully', 'success')
      } else {
        addToast('Failed to update company', 'error')
      }
    } catch (error) {
      console.error('Error updating company:', error)
      addToast('Failed to update company', 'error')
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
          addToast(`Company ${company.is_active ? 'deactivated' : 'activated'} successfully`, 'success')
        } else {
          addToast('Failed to update company status', 'error')
        }
      } catch (error) {
        console.error('Error updating company status:', error)
        addToast('Failed to update company status', 'error')
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
                <h1 className="text-xl font-semibold text-gray-900">Company Details</h1>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
            <nav className="flex space-x-2 min-w-max p-1 bg-gray-100/50 rounded-xl border border-gray-200/60 shadow-inner">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
                { id: 'orders', label: 'Orders', icon: Package, count: orders.length },
                { id: 'challans', label: 'Challans', icon: DeliveryIcon, count: deliveryChallans.length },
                { id: 'parts', label: 'Parts', icon: Settings, count: parts.length },
                { id: 'supervisors', label: 'Supervisors', icon: Users, count: supervisors.length },
                { id: 'operators', label: 'Operators', icon: Users, count: operators.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm flex items-center transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                    }`}
                >
                  <tab.icon className={`h-4 w-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                      }`}>
                      {tab.count}
                    </span>
                  )}
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
