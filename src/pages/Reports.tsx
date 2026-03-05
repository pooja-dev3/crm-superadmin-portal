import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingCart, FileText, Calendar, Download, Filter } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import { customerApi } from '../services'
import { ordersApi } from '../services/orders'
import { adminApi } from '../services/admin'
import type { ApiResponse } from '../types/api'
import { useToast } from '../contexts/ToastContext'

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
  const { addToast } = useToast()

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
      addToast('Failed to export data', 'error')
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

  const maxRevenue = Math.max(...(reportData.monthlyRevenue.length > 0 ? reportData.monthlyRevenue.map(m => m.amount) : [1]))

  return (
    <div className="space-y-6 animate-fade-in-scale">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-slide-in-up">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            System performance and business metrics overview
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          {/* Pill-shaped Segmented Date Selector */}
          <div className="flex bg-gray-100 p-1 rounded-full text-sm font-medium border border-gray-200 shadow-inner">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: '1y', label: '1Y' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`py-1.5 px-4 rounded-full transition-all duration-200 ${timeRange === range.id
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-medium text-sm">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards with Hover Effects */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        {[
          { title: 'Total Revenue', value: `₹${reportData.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100/50', border: 'hover:border-emerald-300' },
          { title: 'Total Orders', value: reportData.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100/50', border: 'hover:border-blue-300' },
          { title: 'Companies', value: reportData.totalCompanies, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100/50', border: 'hover:border-purple-300' },
          { title: 'Challans', value: reportData.totalChallans, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100/50', border: 'hover:border-orange-300' },
          { title: 'Customers', value: reportData.totalCustomers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-100/50', border: 'hover:border-teal-300' },
          { title: 'Parts', value: reportData.totalParts, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100/50', border: 'hover:border-indigo-300' }
        ].map((metric, idx) => (
          <div key={metric.title} className={`bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1 ${metric.border}`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-xl ${metric.bg}`}>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                    {metric.title}
                  </dt>
                  <dd className="text-xl font-bold text-gray-900 mt-1">
                    {metric.value}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
        {/* Modern Vertical Bar Chart for Monthly Revenue */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 flex flex-col h-[380px]">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Revenue Trend (Last 6 Months)
          </h3>
          <div className="flex-1 flex items-end justify-between space-x-2 pt-4 relative border-b border-gray-200 pb-2">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="border-t border-gray-100 w-full h-0"></div>
              ))}
            </div>

            {reportData.monthlyRevenue.map((month) => {
              const percentage = maxRevenue > 0 ? (month.amount / maxRevenue) * 100 : 0
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center group relative z-10">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs py-1 px-2 rounded tracking-wider shadow pointer-events-none transition-opacity font-medium whitespace-nowrap">
                    ₹{month.amount.toLocaleString()}
                  </div>
                  {/* Vertical Bar */}
                  <div className="w-full flex justify-center h-full items-end pb-1">
                    <div
                      className="w-4/5 sm:w-12 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-700 ease-out group-hover:opacity-80"
                      style={{ height: `${Math.max(percentage, 2)}%` }} // Give at least 2% height so empty months still show a sliver
                    ></div>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-gray-400">
                    {month.month}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Improved Company Performance Ranking */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 flex flex-col h-[380px]">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-500" />
            Top Performing Companies
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {reportData.companyPerformance.map((company, index) => (
              <div key={company.company} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'
                    }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{company.company}</p>
                    <p className="text-xs font-medium text-gray-400 flex items-center mt-0.5">
                      <ShoppingCart className="h-3 w-3 mr-1" /> {company.orders} orders
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block">
                    ₹{company.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {reportData.companyPerformance.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                No company data available for this timeframe
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stacked Progress Bar for Order Status & Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
        {/* Visual Priority Status Breakdown */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-500" />
            Order Status Distribution
          </h3>

          {(() => {
            const { pending, processing, completed, cancelled } = reportData.statusBreakdown;
            const total = pending + processing + completed + cancelled;
            const getPct = (val: number) => total > 0 ? (val / total) * 100 : 0;

            return (
              <div className="space-y-6">
                {/* Stacked Bar */}
                <div className="w-full flex h-4 rounded-full overflow-hidden bg-gray-100 shadow-inner">
                  {total > 0 ? (
                    <>
                      <div className="bg-green-500 transition-all duration-500" style={{ width: `${getPct(completed)}%` }} title={`Completed: ${completed}`}></div>
                      <div className="bg-blue-500 transition-all duration-500" style={{ width: `${getPct(processing)}%` }} title={`Processing: ${processing}`}></div>
                      <div className="bg-yellow-400 transition-all duration-500" style={{ width: `${getPct(pending)}%` }} title={`Pending: ${pending}`}></div>
                      <div className="bg-red-500 transition-all duration-500" style={{ width: `${getPct(cancelled)}%` }} title={`Cancelled: ${cancelled}`}></div>
                    </>
                  ) : (
                    <div className="w-full bg-gray-200"></div>
                  )}
                </div>

                {/* Legend Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <div className="flex items-center justify-center mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 shadow-sm"></span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Completed</span>
                    </div>
                    <div className="text-xl font-bold text-gray-800">{completed}</div>
                    <div className="text-xs font-semibold text-gray-400">{Math.round(getPct(completed))}%</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <div className="flex items-center justify-center mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 shadow-sm"></span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Processing</span>
                    </div>
                    <div className="text-xl font-bold text-gray-800">{processing}</div>
                    <div className="text-xs font-semibold text-gray-400">{Math.round(getPct(processing))}%</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <div className="flex items-center justify-center mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 mr-2 shadow-sm"></span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Pending</span>
                    </div>
                    <div className="text-xl font-bold text-gray-800">{pending}</div>
                    <div className="text-xs font-semibold text-gray-400">{Math.round(getPct(pending))}%</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <div className="flex items-center justify-center mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-sm"></span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Cancelled</span>
                    </div>
                    <div className="text-xl font-bold text-gray-800">{cancelled}</div>
                    <div className="text-xs font-semibold text-gray-400">{Math.round(getPct(cancelled))}%</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Mini Performance Cards */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10 transform group-hover:scale-110 transition-transform duration-500"></div>
            <h4 className="text-sm font-medium text-indigo-100 mb-1">Avg Order Value</h4>
            <div className="text-3xl font-bold tracking-tight">₹{reportData.totalOrders > 0 ? Math.round(reportData.totalRevenue / reportData.totalOrders).toLocaleString() : 0}</div>
            <div className="mt-4 flex items-center text-xs text-indigo-100 font-medium">
              <TrendingUp className="h-4 w-4 mr-1" /> Health Metric
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10 transform group-hover:scale-110 transition-transform duration-500"></div>
            <h4 className="text-sm font-medium text-emerald-100 mb-1">Delivery Fulfillment</h4>
            <div className="text-3xl font-bold tracking-tight">{reportData.totalOrders > 0 ? Math.round((reportData.totalChallans / reportData.totalOrders) * 100) : 0}%</div>
            <div className="mt-4 flex items-center text-xs text-emerald-100 font-medium">
              <FileText className="h-4 w-4 mr-1" /> Challans to Orders Ratio
            </div>
          </div>
        </div>
      </div>

      {/* Styled Recent Orders Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: '500ms' }}>
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-500" />
            Most Recent Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">
                  Sr No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reportData.recentOrders.length > 0 ? reportData.recentOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {order.po_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                    ₹{order.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${order.status === 'Received'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${order.status === 'Received' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {order.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No recent orders available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports