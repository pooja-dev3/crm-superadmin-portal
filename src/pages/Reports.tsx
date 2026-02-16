import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingCart, FileText, Calendar, Download, Filter } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import { customerApi } from '../services'
import { ordersApi } from '../services/orders'
import { adminApi } from '../services/admin'
import type { ApiResponse } from '../types/api'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  totalCompanies: number
  totalChallans: number
  totalCustomers: number
  totalAdmins: number
  totalParts: number
  monthlyRevenue: { month: string; amount: number }[]
  companyPerformance: { company: string; orders: number; revenue: number }[]
  recentOrders: {
    id: number
    po_no: string
    customer: string
    amount: number
    status: string
    created_at: string
  }[]
  statusBreakdown: {
    pending: number
    processing: number
    completed: number
    cancelled: number
  }
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [timeRange])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch all data in parallel
      const [
        companiesResponse,
        ordersResponse,
        challansResponse,
        customersResponse,
        adminsResponse,
        partsResponse
      ] = await Promise.all([
        superadminApi.getCompanies() as unknown as ApiResponse<any[]>,
        ordersApi.getAllOrders() as unknown as ApiResponse<any[]>,
        superadminApi.getDeliveryChallans() as unknown as { success: boolean; data: any },
        customerApi.getAllCustomers() as unknown as ApiResponse<any[]>,
        adminApi.getAllAdmins() as unknown as ApiResponse<any[]>,
        superadminApi.getParts() as unknown as ApiResponse<any[]>
      ])

      // Process data from responses
      const companies = (companiesResponse as any)?.success ? 
        (Array.isArray((companiesResponse as any).data) ? (companiesResponse as any).data : (companiesResponse as any).data?.data || []) : []
      
      const orders = (ordersResponse as any)?.success ? 
        (Array.isArray((ordersResponse as any).data) ? (ordersResponse as any).data : (ordersResponse as any).data?.data || []) : []
      
      const challans = (challansResponse as any)?.success ? 
        (Array.isArray((challansResponse as any).data) ? (challansResponse as any).data : (challansResponse as any).data?.data || []) : []
      
      const customers = (customersResponse as any)?.success ? 
        (Array.isArray((customersResponse as any).data) ? (customersResponse as any).data : (customersResponse as any).data?.data || []) : []
      
      const admins = (adminsResponse as any)?.success ? 
        (Array.isArray((adminsResponse as any).data) ? (adminsResponse as any).data : (adminsResponse as any).data?.data || []) : []
      
      const parts = (partsResponse as any)?.success ? 
        (Array.isArray((partsResponse as any).data) ? (partsResponse as any).data : (partsResponse as any).data?.data || []) : []

      // Calculate metrics
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.price || '0'), 0)
      const totalOrders = orders.length
      const totalCompanies = companies.length
      const totalChallans = challans.length
      const totalCustomers = customers.length
      const totalAdmins = admins.length
      const totalParts = parts.length

      // Generate monthly revenue data
      const monthlyRevenue = generateMonthlyRevenue(orders)
      
      // Generate company performance data
      const companyPerformance = generateCompanyPerformance(orders, companies)
      
      // Get recent orders
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          po_no: order.po_no,
          customer: order.customer?.name || order.comp_name || 'Unknown',
          amount: parseFloat(order.price || '0'),
          status: order.po_received ? 'Received' : 'Pending',
          created_at: order.created_at
        }))

      // Status breakdown
      const statusBreakdown = {
        pending: orders.filter((order: any) => !order.po_received).length,
        processing: orders.filter((order: any) => order.po_received && order.balance_qty > 0).length,
        completed: orders.filter((order: any) => order.balance_qty === 0).length,
        cancelled: 0 // Add if you have cancelled status
      }

      const processedData: ReportData = {
        totalRevenue,
        totalOrders,
        totalCompanies,
        totalChallans,
        totalCustomers,
        totalAdmins,
        totalParts,
        monthlyRevenue,
        companyPerformance,
        recentOrders,
        statusBreakdown
      }

      setReportData(processedData)
    } catch (error) {
      console.error('Error fetching report data:', error)
      setError('Failed to load report data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateMonthlyRevenue = (orders: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    const monthlyData = months.map((month, index) => {
      const monthOrders = orders.filter((order: any) => {
        const orderMonth = new Date(order.created_at).getMonth()
        return orderMonth === index
      })
      const revenue = monthOrders.reduce((sum: number, order: any) => sum + parseFloat(order.price || '0'), 0)
      return { month, amount: revenue }
    })
    
    // Return last 6 months
    return monthlyData.slice(-6)
  }

  const generateCompanyPerformance = (orders: any[], companies: any[]) => {
    const performanceMap = new Map<string, { orders: number; revenue: number }>()
    
    orders.forEach((order: any) => {
      const company = order.comp_name || order.customer?.name || 'Unknown'
      const current = performanceMap.get(company) || { orders: 0, revenue: 0 }
      current.orders++
      current.revenue += parseFloat(order.price || '0')
      performanceMap.set(company, current)
    })
    
    return Array.from(performanceMap.entries())
      .map(([company, data]) => ({ company, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      // Create CSV content
      const csvContent = generateCSV()
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = () => {
    if (!reportData) return ''
    
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Revenue', reportData.totalRevenue.toString()],
      ['Total Orders', reportData.totalOrders.toString()],
      ['Total Companies', reportData.totalCompanies.toString()],
      ['Total Customers', reportData.totalCustomers.toString()],
      ['Total Admins', reportData.totalAdmins.toString()],
      ['Total Parts', reportData.totalParts.toString()],
      ['Total Delivery Challans', reportData.totalChallans.toString()]
    ]
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchReportData}
          className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load report data.</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...reportData.monthlyRevenue.map(m => m.amount))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            System analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-md">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{reportData.totalRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-200 rounded-md">
                  <ShoppingCart className="h-6 w-6 text-blue-900" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reportData.totalOrders.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-100 rounded-md">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Companies
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reportData.totalCompanies}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-orange-100 rounded-md">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Challans
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reportData.totalChallans}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-teal-100 rounded-md">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Customers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reportData.totalCustomers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-indigo-100 rounded-md">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Parts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reportData.totalParts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {reportData.monthlyRevenue.map((month) => {
              const percentage = (month.amount / maxRevenue) * 100
              return (
                <div key={month.month} className="flex items-center">
                  <div className="w-12 text-sm font-medium text-gray-500">
                    {month.month}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-900 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-sm font-medium text-gray-900 text-right">
                    ₹{month.amount.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Company Performance */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Companies</h3>
          <div className="space-y-4">
            {reportData.companyPerformance.map((company, index) => (
              <div key={company.company} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-900">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.company}</p>
                    <p className="text-xs text-gray-500">{company.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{company.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.po_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{order.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'Received' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reportData.statusBreakdown.pending}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.statusBreakdown.processing}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {reportData.statusBreakdown.completed}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {reportData.statusBreakdown.cancelled}
            </div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((reportData.totalOrders / reportData.totalCompanies) * 10) / 10}
            </div>
            <div className="text-sm text-gray-500">Avg Orders per Company</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              ₹{Math.round(reportData.totalRevenue / reportData.totalOrders)}
            </div>
            <div className="text-sm text-gray-500">Avg Order Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((reportData.totalChallans / reportData.totalOrders) * 100)}%
            </div>
            <div className="text-sm text-gray-500">Delivery Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports