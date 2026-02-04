import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User,
  Building2,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  LogIn,
  Eye,
  ShoppingCart,
  FileText,
  Users,
  Activity
} from 'lucide-react'

interface Company {
  id: string
  name: string
  status: 'active' | 'blocked'
  adminEmail: string
  createdDate: string
  logo?: string
  description?: string
  address?: string
  phone?: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdDate: string
}

interface DeliveryChallan {
  id: string
  challanNumber: string
  status: string
  orderId: string
  createdDate: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastLogin: string
}

interface ActivityLog {
  id: string
  action: string
  user: string
  timestamp: string
  details: string
}

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [company, setCompany] = useState<Company | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock company data
        const mockCompany: Company = {
          id: id || '1',
          name: 'TechCorp Solutions',
          status: 'active',
          adminEmail: 'admin@techcorp.com',
          createdDate: '2024-01-15',
          logo: '/logos/techcorp.png',
          description: 'Leading technology solutions provider specializing in enterprise software development.',
          address: '123 Tech Street, Silicon Valley, CA 94025',
          phone: '+1 (555) 123-4567'
        }

        // Mock orders data
        const mockOrders: Order[] = [
          { id: '1', orderNumber: 'ORD-001', status: 'completed', total: 15000, createdDate: '2024-01-20' },
          { id: '2', orderNumber: 'ORD-002', status: 'processing', total: 25000, createdDate: '2024-01-18' },
          { id: '3', orderNumber: 'ORD-003', status: 'pending', total: 8000, createdDate: '2024-01-16' }
        ]

        // Mock delivery challans
        const mockDeliveryChallans: DeliveryChallan[] = [
          { id: '1', challanNumber: 'DC-001', status: 'delivered', orderId: 'ORD-001', createdDate: '2024-01-21' },
          { id: '2', challanNumber: 'DC-002', status: 'in_transit', orderId: 'ORD-002', createdDate: '2024-01-19' }
        ]

        // Mock users data
        const mockUsers: User[] = [
          { id: '1', name: 'John Doe', email: 'john@techcorp.com', role: 'Admin', status: 'active', lastLogin: '2024-01-28' },
          { id: '2', name: 'Jane Smith', email: 'jane@techcorp.com', role: 'Manager', status: 'active', lastLogin: '2024-01-27' },
          { id: '3', name: 'Bob Johnson', email: 'bob@techcorp.com', role: 'Employee', status: 'inactive', lastLogin: '2024-01-25' }
        ]

        // Mock activity logs
        const mockActivityLogs: ActivityLog[] = [
          { id: '1', action: 'Login', user: 'John Doe', timestamp: '2024-01-28T10:30:00Z', details: 'Successful login from Chrome' },
          { id: '2', action: 'Order Created', user: 'Jane Smith', timestamp: '2024-01-27T14:15:00Z', details: 'Created order ORD-002' },
          { id: '3', action: 'User Updated', user: 'John Doe', timestamp: '2024-01-26T09:45:00Z', details: 'Updated user permissions for Bob Johnson' }
        ]

        setCompany(mockCompany)
        setOrders(mockOrders)
        setDeliveryChallans(mockDeliveryChallans)
        setUsers(mockUsers)
        setActivityLogs(mockActivityLogs)
      } catch (error) {
        console.error('Error fetching company data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanyData()
  }, [id])

  const handleLoginAsAdmin = () => {
    // TODO: Implement login as company admin functionality
    console.log('Login as company admin for:', company?.name)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'delivery-challans', label: 'Delivery Challans', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Company not found.</p>
        <button
          onClick={() => navigate('/companies')}
          className="mt-4 text-blue-900 hover:text-blue-800"
        >
          Back to Companies
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/companies')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Companies
          </button>
        </div>
        <button
          onClick={handleLoginAsAdmin}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Login as Company Admin
        </button>
      </div>

      {/* Company Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          {company.logo && (
            <img
              src={company.logo}
              alt={company.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                company.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {company.status === 'active' ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                {company.status}
              </span>
              <span className="text-sm text-gray-500">
                Created: {new Date(company.createdDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-900 text-blue-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                  <dl className="space-y-3">
                    <div className="flex">
                      <dt className="text-sm font-medium text-gray-500 w-32">Name:</dt>
                      <dd className="text-sm text-gray-900">{company.name}</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-sm font-medium text-gray-500 w-32">Status:</dt>
                      <dd className="text-sm text-gray-900 capitalize">{company.status}</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-sm font-medium text-gray-500 w-32">Admin Email:</dt>
                      <dd className="text-sm text-gray-900">{company.adminEmail}</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-sm font-medium text-gray-500 w-32">Phone:</dt>
                      <dd className="text-sm text-gray-900">{company.phone}</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-sm font-medium text-gray-500 w-32">Created:</dt>
                      <dd className="text-sm text-gray-900">{new Date(company.createdDate).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                  <p className="text-sm text-gray-900">{company.address}</p>
                </div>
              </div>
              {company.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                  <p className="text-sm text-gray-900">{company.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Orders ({orders.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-900 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delivery Challans Tab */}
          {activeTab === 'delivery-challans' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Challans ({deliveryChallans.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Challan Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryChallans.map((challan) => (
                      <tr key={challan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {challan.challanNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            challan.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : challan.status === 'in_transit'
                              ? 'bg-blue-200 text-blue-900'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {challan.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {challan.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(challan.createdDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-900 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Users ({users.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'activity-logs' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Logs</h3>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-900" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {log.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {log.user} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {log.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyDetails