import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingCart, FileText, Calendar } from 'lucide-react'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  totalCompanies: number
  totalChallans: number
  monthlyRevenue: { month: string; amount: number }[]
  companyPerformance: { company: string; orders: number; revenue: number }[]
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    // Mock API call - replace with actual API
    const fetchReportData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock data
        const mockData: ReportData = {
          totalRevenue: 285000,
          totalOrders: 1250,
          totalCompanies: 45,
          totalChallans: 320,
          monthlyRevenue: [
            { month: 'Jan', amount: 45000 },
            { month: 'Feb', amount: 52000 },
            { month: 'Mar', amount: 48000 },
            { month: 'Apr', amount: 61000 },
            { month: 'May', amount: 55000 },
            { month: 'Jun', amount: 69000 }
          ],
          companyPerformance: [
            { company: 'TechCorp Solutions', orders: 45, revenue: 65000 },
            { company: 'GlobalTech Inc.', orders: 38, revenue: 52000 },
            { company: 'DataFlow Systems', orders: 32, revenue: 48000 },
            { company: 'InnovateLabs', orders: 28, revenue: 42000 },
            { company: 'CloudSync Ltd.', orders: 25, revenue: 38000 }
          ]
        }

        setReportData(mockData)
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                    Total Companies
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
                    Delivery Challans
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reportData.totalChallans}
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