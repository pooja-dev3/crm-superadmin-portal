import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CheckCircle,
  XCircle,
  ShoppingCart,
  FileText,
  Activity,
  Users,
  BarChart3,
  Calendar,
  Zap,
  Package,
  Shield,
  UserCheck,
  HardHat,
  Wrench,
  ArrowRight,
  Clock
} from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { DashboardResponse, DashboardStats } from '../types/api'

interface ChartData {
  labels: string[]
  values: number[]
  colors?: string[]
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalCompanyUsers: 0,
    totalCustomers: 0,
    totalParts: 0,
    totalOrders: 0,
    totalDeliveryChallans: 0,
    systemHealth: 0,
    activeUsers: 0,
    roleSummary: {
      superadmin: 0,
      admin: 0,
      supervisor: 0,
      operator: 0
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  const navigate = useNavigate()

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const [companiesRes, ordersRes, customersRes] = await Promise.allSettled([
        superadminApi.getCompanies(1),
        superadminApi.getOrders(),
        superadminApi.getCustomers()
      ])

      const activities: any[] = []

      const getRelativeTime = (dateString: string) => {
        if (!dateString) return 'Recently'
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        return `${Math.floor(diffInSeconds / 86400)}d ago`
      }

      if (companiesRes.status === 'fulfilled' && (companiesRes.value as any).success) {
        const responseData = (companiesRes.value as any).data
        const companies = Array.isArray(responseData) ? responseData : (responseData?.data || [])
        companies.slice(0, 5).forEach((company: any) => {
          const dateStr = company.created_at || new Date().toISOString()
          activities.push({
            id: `comp-${company.id}`,
            type: 'company',
            title: 'New Company Registered',
            description: `${company.comp_name || company.company_name || 'A company'} joined the platform`,
            time: getRelativeTime(dateStr),
            timestamp: new Date(dateStr).getTime(),
            status: company.status === 'active' || company.is_active ? 'success' : 'pending',
          })
        })
      }

      if (ordersRes.status === 'fulfilled' && (ordersRes.value as any).success) {
        const orders = Array.isArray((ordersRes.value as any).data) ? (ordersRes.value as any).data : []
        orders.slice(0, 5).forEach((order: any) => {
          const dateStr = order.orderDate || order.created_at || new Date().toISOString()
          activities.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'Order Placed',
            description: `PO #${order.po_no || order.id} has been created`,
            time: getRelativeTime(dateStr),
            timestamp: new Date(dateStr).getTime(),
            status: order.po_received ? 'completed' : 'pending',
            amount: order.price ? `₹${Number(order.price).toLocaleString()}` : undefined
          })
        })
      }

      if (customersRes.status === 'fulfilled' && (customersRes.value as any).success) {
        const customers = Array.isArray((customersRes.value as any).data) ? (customersRes.value as any).data : []
        customers.slice(0, 5).forEach((customer: any) => {
          const dateStr = customer.created_at || new Date().toISOString()
          activities.push({
            id: `cust-${customer.id}`,
            type: 'customer',
            title: 'New Customer Added',
            description: `${customer.name || 'A customer'} registered successfully`,
            time: getRelativeTime(dateStr),
            timestamp: new Date(dateStr).getTime(),
            status: 'success',
          })
        })
      }

      activities.sort((a, b) => b.timestamp - a.timestamp)
      setRecentActivities(activities.slice(0, 6))
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      setRecentActivities([])
    }
  }

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashboardResponse = await superadminApi.getDashboard() as DashboardResponse
        if (dashboardResponse.success && dashboardResponse.data) {
          const { summary, role_summary } = dashboardResponse.data
          setStats({
            totalCompanies: summary.total_companies || 0,
            totalCompanyUsers: summary.total_company_users || 0,
            totalCustomers: summary.total_customers || 0,
            totalParts: summary.total_parts || 0,
            totalOrders: summary.total_orders || 0,
            totalDeliveryChallans: summary.total_delivery_challans || 0,
            systemHealth: 98.7,
            activeUsers: summary.total_company_users || 0,
            roleSummary: {
              superadmin: role_summary?.superadmin || 0,
              admin: role_summary?.admin || 0,
              supervisor: role_summary?.supervisor || 0,
              operator: role_summary?.operator || 0
            }
          })
        }
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
      title: 'Total Companies',
      value: stats.totalCompanies,
      icon: Building2,
      gradient: 'from-blue-600 to-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      label: 'Registered companies',
      onClick: () => navigate('/companies')
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      gradient: 'from-purple-600 to-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      label: 'Active customers',
      onClick: () => navigate('/customers')
    },
    {
      title: 'Active Users',
      value: stats.totalCompanyUsers,
      icon: UserCheck,
      gradient: 'from-emerald-600 to-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      label: 'Across all companies',
      onClick: () => navigate('/company-admins')
    },
    {
      title: 'Total Parts',
      value: stats.totalParts,
      icon: Package,
      gradient: 'from-orange-600 to-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      label: 'Parts in catalogue',
      onClick: () => navigate('/parts')
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      gradient: 'from-indigo-600 to-indigo-500',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      label: 'Orders processed',
      onClick: () => navigate('/orders')
    },
    {
      title: 'Delivery Challans',
      value: stats.totalDeliveryChallans,
      icon: FileText,
      gradient: 'from-rose-600 to-rose-500',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      label: 'Challans issued',
      onClick: () => navigate('/delivery-challans')
    }
  ]

  const quickActions = [
    {
      label: 'Add New Company',
      desc: 'Register a new company account',
      icon: Building2,
      color: 'text-blue-600',
      border: 'border-blue-100',
      hover: 'hover:border-blue-300 hover:bg-blue-50',
      onClick: () => navigate('/companies')
    },
    {
      label: 'View Reports',
      desc: 'Generate system analytics',
      icon: BarChart3,
      color: 'text-emerald-600',
      border: 'border-emerald-100',
      hover: 'hover:border-emerald-300 hover:bg-emerald-50',
      onClick: () => navigate('/reports')
    },
    {
      label: 'Process Orders',
      desc: 'Review pending orders',
      icon: ShoppingCart,
      color: 'text-purple-600',
      border: 'border-purple-100',
      hover: 'hover:border-purple-300 hover:bg-purple-50',
      onClick: () => navigate('/orders')
    }
  ]

  const roleBreakdown = [
    { label: 'Superadmin', count: stats.roleSummary?.superadmin || 0, icon: Shield, color: 'text-blue-700', bg: 'bg-blue-50', bar: 'bg-blue-500' },
    { label: 'Admin', count: stats.roleSummary?.admin || 0, icon: UserCheck, color: 'text-purple-700', bg: 'bg-purple-50', bar: 'bg-purple-500' },
    { label: 'Supervisor', count: stats.roleSummary?.supervisor || 0, icon: HardHat, color: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
    { label: 'Operator', count: stats.roleSummary?.operator || 0, icon: Wrench, color: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500' },
  ]

  const totalRoleCount = roleBreakdown.reduce((sum, r) => sum + r.count, 0) || 1

  const activityConfig: Record<string, { icon: any, dotColor: string, iconBg: string, iconColor: string }> = {
    company: { icon: Building2, dotColor: 'bg-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    order: { icon: ShoppingCart, dotColor: 'bg-indigo-500', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    customer: { icon: Users, dotColor: 'bg-purple-500', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  }

  const statusConfig: Record<string, { label: string, badge: string }> = {
    success: { label: 'Success', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    completed: { label: 'Completed', badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
    pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
    in_transit: { label: 'In Transit', badge: 'bg-sky-50 text-sky-700 border border-sky-200' },
  }

  const greetingHour = currentTime.getHours()
  const greeting = greetingHour < 12 ? 'Good Morning' : greetingHour < 17 ? 'Good Afternoon' : 'Good Evening'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-scale">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-8 py-8 shadow-lg">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 rounded-full bg-white/5"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-white/5"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-1">{greeting}</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">CRM Superadmin Panel</h1>
            <p className="mt-2 text-blue-200 text-sm">Here's what's happening in your system today.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <Clock className="h-4 w-4 text-blue-200" />
              <span className="text-white font-bold text-sm tabular-nums">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-blue-200" />
              <span className="text-white text-sm font-medium">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Summary pills */}
        <div className="relative z-10 flex flex-wrap gap-3 mt-6">
          {[
            { label: 'Companies', value: stats.totalCompanies },
            { label: 'Orders', value: stats.totalOrders },
            { label: 'Customers', value: stats.totalCustomers },
            { label: 'System Health', value: `${stats.systemHealth}%` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20 text-sm text-white backdrop-blur-sm">
              <span className="font-extrabold">{item.value}</span>
              <span className="text-blue-200 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              onClick={card.onClick}
              className="text-left bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{card.title}</p>
                    <p className="text-3xl font-extrabold text-gray-900 group-hover:text-blue-900 transition-colors">{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">{card.label}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${card.bg} ${card.text} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className={`flex items-center mt-4 text-xs font-bold ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <span>View details</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Role Breakdown + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Role Distribution */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-600" />
                User Role Distribution
              </h3>
              <p className="text-xs text-gray-500 mt-1">{totalRoleCount} total users across all roles</p>
            </div>
            <button
              onClick={() => navigate('/company-admins')}
              className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4">
            {roleBreakdown.map((role) => {
              const Icon = role.icon
              const pct = Math.round((role.count / totalRoleCount) * 100)
              return (
                <div key={role.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${role.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${role.color}`} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{role.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${role.color}`}>{role.count}</span>
                      <span className="text-xs text-gray-400">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${role.bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-900 flex items-center mb-6">
            <Zap className="h-4 w-4 text-yellow-500 mr-2" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`w-full text-left p-4 rounded-xl border ${action.border} ${action.hover} transition-all duration-200 group flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{action.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{action.desc}</div>
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </button>
              )
            })}

            {/* System Health indicator */}
            <div className="mt-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  System Health
                </div>
                <span className="text-sm font-extrabold text-emerald-600">{stats.systemHealth}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.systemHealth}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">All systems operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center">
            <Calendar className="h-4 w-4 text-blue-600 mr-2" />
            Recent Activity
          </h3>
          <span className="text-xs text-gray-400 font-medium">Last 5 events</span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Activity className="h-10 w-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentActivities.map((activity: any) => {
              const cfg = activityConfig[activity.type] || activityConfig.company
              const statusCfg = statusConfig[activity.status] || statusConfig.pending
              const Icon = cfg.icon
              return (
                <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                  <div className={`flex-shrink-0 w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{activity.description}</p>
                    {activity.amount && (
                      <p className="text-xs font-bold text-emerald-600 mt-1">{activity.amount}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.badge}`}>
                      {statusCfg.label}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">{activity.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default Dashboard