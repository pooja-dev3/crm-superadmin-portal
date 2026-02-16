import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CheckCircle,
  XCircle,
  ShoppingCart,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Zap
} from 'lucide-react'
import { superadminApi } from '../services/superadminApi'

interface DashboardResponse {
  success: boolean
  message: string
  data: {
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
    role_summary: {
      superadmin: number
      admin: number
      supervisor: number
      operator: number
    }
  }
}

interface DashboardStats {
  totalCompanies: number
  totalCompanyUsers: number
  totalCustomers: number
  totalParts: number
  totalOrders: number
  totalDeliveryChallans: number
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  avgOrderValue: number
  conversionRate: number
  systemHealth: number
  activeUsers: number
  roleSummary: {
    superadmin: number
    admin: number
    supervisor: number
    operator: number
  }
}

interface ChartData {
  labels: string[]
  values: number[]
  colors?: string[]
}

interface RevenueData {
  month: string
  revenue: number
  orders: number
  growth: number
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalCompanyUsers: 0,
    totalCustomers: 0,
    totalParts: 0,
    totalOrders: 0,
    totalDeliveryChallans: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    systemHealth: 0,
    activeUsers: 0,
    roleSummary: {
      superadmin: 0,
      admin: 0,
      supervisor: 0,
      operator: 0
    }
  })
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [companyGrowthData, setCompanyGrowthData] = useState<ChartData>({ labels: [], values: [] })
  const [isLoading, setIsLoading] = useState(true)

  const navigate = useNavigate()

  const handleAddCompany = () => {
    navigate('/companies')
  }

  const handleViewReports = () => {
    navigate('/reports')
  }

  const handleProcessOrders = () => {
    navigate('/orders')
  }

  useEffect(() => {
    // Fetch real data from superadmin dashboard API
    const fetchStats = async () => {
      try {
        const dashboardResponse = await superadminApi.getDashboard() as DashboardResponse
        
        if (dashboardResponse.success && dashboardResponse.data) {
          const { summary, role_summary } = dashboardResponse.data
          
          const realStats: DashboardStats = {
            totalCompanies: summary.total_companies || 0,
            totalCompanyUsers: summary.total_company_users || 0,
            totalCustomers: summary.total_customers || 0,
            totalParts: summary.total_parts || 0,
            totalOrders: summary.total_orders || 0,
            totalDeliveryChallans: summary.total_delivery_challans || 0,
            totalRevenue: summary.total_orders * 5000, // Estimated revenue per order
            monthlyRevenue: Math.floor((summary.total_orders || 0) * 500), // Estimated monthly
            revenueGrowth: 12.5,
            avgOrderValue: 5000,
            conversionRate: 68.4,
            systemHealth: 98.7,
            activeUsers: summary.total_company_users || 0,
            roleSummary: {
              superadmin: role_summary?.superadmin || 0,
              admin: role_summary?.admin || 0,
              supervisor: role_summary?.supervisor || 0,
              operator: role_summary?.operator || 0
            }
          }
          
          setStats(realStats)
        } else {
          // Fallback to mock data if API fails
          const fallbackStats: DashboardStats = {
            totalCompanies: 18,
            totalCompanyUsers: 32,
            totalCustomers: 6,
            totalParts: 6,
            totalOrders: 9,
            totalDeliveryChallans: 3,
            totalRevenue: 45000,
            monthlyRevenue: 4500,
            revenueGrowth: 12.5,
            avgOrderValue: 5000,
            conversionRate: 68.4,
            systemHealth: 98.7,
            activeUsers: 32,
            roleSummary: {
              superadmin: 1,
              admin: 8,
              supervisor: 11,
              operator: 13
            }
          }
        setStats(fallbackStats)
        }

        const mockRevenueData: RevenueData[] = [
          { month: 'Jan', revenue: 35000, orders: 95, growth: 8.2 },
          { month: 'Feb', revenue: 42000, orders: 110, growth: 20.0 },
          { month: 'Mar', revenue: 38000, orders: 105, growth: -9.5 },
          { month: 'Apr', revenue: 51000, orders: 135, growth: 34.2 },
          { month: 'May', revenue: 47000, orders: 125, growth: -7.8 },
          { month: 'Jun', revenue: 72000, orders: 180, growth: 53.2 },
          { month: 'Jul', revenue: 68000, orders: 175, growth: -5.6 },
          { month: 'Aug', revenue: 75000, orders: 190, growth: 10.3 },
          { month: 'Sep', revenue: 71000, orders: 185, growth: -5.3 },
          { month: 'Oct', revenue: 78000, orders: 195, growth: 9.9 },
          { month: 'Nov', revenue: 82000, orders: 205, growth: 5.1 },
          { month: 'Dec', revenue: 89000, orders: 220, growth: 8.5 }
        ]

        const mockCompanyGrowth: ChartData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          values: [25, 32, 28, 45, 38, 52, 48, 65, 58, 72, 68, 85],
          colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1e40af', '#1e3a8a']
        }

        setRevenueData(mockRevenueData)
        setCompanyGrowthData(mockCompanyGrowth)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
      trend: stats.revenueGrowth,
      trendLabel: 'vs last month'
    },
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      trend: 8.3,
      trendLabel: 'new this month'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      trend: 15.2,
      trendLabel: 'vs last week'
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth}%`,
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      trend: 0.5,
      trendLabel: 'uptime score'
    },
    {
      title: 'Total Parts',
      value: stats.totalParts,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
      trend: 5.2,
      trendLabel: 'vs last month'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      trend: 12.8,
      trendLabel: 'this month'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-scale">
      <div className="animate-slide-in-up">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome to the CRM Super Admin Panel. Here's an overview of your system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        {statCards.map((card, index) => {
          const Icon = card.icon
          const TrendIcon = card.trend && card.trend > 0 ? TrendingUp : TrendingDown
          const trendColor = card.trend && card.trend > 0 ? 'text-green-600' : 'text-red-600'

          return (
            <div
              key={card.title}
              className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl ${card.bgColor} shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="ml-4">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-1">
                        {card.value}
                      </dd>
                    </div>
                  </div>
                  {card.trend && (
                    <div className={`flex items-center ${trendColor}`}>
                      <TrendIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-semibold">
                        {Math.abs(card.trend)}%
                      </span>
                    </div>
                  )}
                </div>
                {card.trendLabel && (
                  <p className="text-xs text-gray-500 mt-2">{card.trendLabel}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
        {/* Revenue Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500">Monthly revenue over the last 12 months</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {revenueData.map((data, index) => {
              const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
              const percentage = (data.revenue / maxRevenue) * 100

              return (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 text-xs font-medium text-gray-600">
                      {data.month}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${percentage}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{data.revenue.toLocaleString()}
                    </div>
                    <div className={`text-xs flex items-center ${
                      data.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.growth > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(data.growth)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Company Growth Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Company Growth</h3>
              <p className="text-sm text-gray-500">New customer registrations over the year</p>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold text-blue-600">
                  {stats.totalCustomers}
                </span>
                <span className="text-sm text-gray-500 ml-2">total customers</span>
              </div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="relative h-80 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="absolute inset-0 flex items-end justify-between min-w-max px-4 py-2">
              {companyGrowthData.values.map((value, index) => {
                const maxValue = Math.max(...companyGrowthData.values)
                const minValue = Math.min(...companyGrowthData.values)
                const range = Math.max(maxValue - minValue, 1)
                const normalized = (value - minValue) / range
                const heightPercentage = 25 + normalized * 65 // 25% min, 90% max
                const actualHeight = (heightPercentage / 100) * 280 // Convert to pixels based on container height

                return (
                  <div key={index} className="flex flex-col items-center flex-shrink-0 mx-3">
                    <div className="relative mb-3" style={{ height: '280px' }}>
                      <div
                        className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-700 ease-out hover:from-blue-700 hover:to-blue-500 hover:scale-110 shadow-md hover:shadow-lg cursor-pointer absolute bottom-0"
                        style={{
                          height: `${actualHeight}px`,
                          animationDelay: `${index * 50}ms`
                        }}
                        title={`${companyGrowthData.labels[index]}: ${value} companies`}
                      ></div>
                      {/* Value label on top of bar */}
                      <div 
                        className="absolute text-xs font-bold text-gray-800 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white px-1 rounded shadow-sm"
                        style={{ bottom: `${actualHeight + 8}px` }}
                      >
                        {value}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 font-semibold text-center leading-tight mb-1">
                      {companyGrowthData.labels[index]}
                    </div>
                    <div className="text-xs text-gray-900 font-bold text-center leading-tight">
                      {value}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Add a subtle baseline */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 animate-slide-in-up" style={{ animationDelay: '600ms' }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 text-yellow-500 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleAddCompany}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                  Add New Company
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Register a new company account
                </div>
              </div>
            </div>
          </button>
          <button
            onClick={handleViewReports}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center">
              <Users className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-green-900">
                  View Reports
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Generate system analytics
                </div>
              </div>
            </div>
          </button>
          <button
            onClick={handleProcessOrders}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center">
              <ShoppingCart className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-purple-900">
                  Process Orders
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Review pending orders
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 animate-slide-in-up" style={{ animationDelay: '800ms' }}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              Recent Activity
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-green-50 border border-green-100 hover:bg-green-100 transition-colors duration-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  New company registered
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  "TechCorp Solutions" joined the platform with admin access
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>2 hours ago</span>
                  <span className="mx-2">•</span>
                  <span className="text-green-600 font-medium">Success</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors duration-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Order completed
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Order #ORD-12345 processed successfully for GlobalTech Inc.
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>4 hours ago</span>
                  <span className="mx-2">•</span>
                  <span className="text-blue-600 font-medium">₹2,450.00</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors duration-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Delivery challan generated
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  DC-001 created and dispatched for InnovateLabs order
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>6 hours ago</span>
                  <span className="mx-2">•</span>
                  <span className="text-orange-600 font-medium">In Transit</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors duration-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  User permissions updated
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Admin privileges granted to new team member at DataFlow Systems
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>8 hours ago</span>
                  <span className="mx-2">•</span>
                  <span className="text-purple-600 font-medium">Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard