import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Building2,
  Users,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Package,
  Building,
  ShieldCheck
} from 'lucide-react'

// Define the structure of our menu items
type MenuItem = {
  path: string
  label: string
  icon: React.ElementType
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuSections: MenuSection[] = [
    {
      title: 'Overview',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
      ]
    },
    {
      title: 'Entities',
      items: [
        { path: '/companies', label: 'Companies', icon: Building2 },
        { path: '/admins', label: 'Company Admins', icon: Users },
        { path: '/customers', label: 'Customers', icon: Building },
      ]
    },
    {
      title: 'Inventory & Sales',
      items: [
        { path: '/parts', label: 'Parts', icon: Package },
        { path: '/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/delivery-challans', label: 'Delivery Challans', icon: FileText },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ]

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-gray-200 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-start h-16 px-6 bg-gradient-to-r from-blue-900 to-blue-800 shadow-md">
        <ShieldCheck className="h-6 w-6 text-white mr-2" />
        <h1 className="text-lg font-bold text-white tracking-wide">CRM <span className="font-light">Super Admin</span></h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-blue-50 text-blue-800 border-l-4 border-blue-600 shadow-sm'
                        : 'text-gray-600 border-l-4 border-transparent hover:bg-white hover:text-blue-900 hover:shadow-sm hover:translate-x-1'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`mr-3 h-5 w-5 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                            }`}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - User Profile */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 shadow-inner">
              <span className="text-blue-800 font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || 'Super Admin'}
            </p>
            <p className="text-xs font-medium text-gray-500 truncate">
              {user?.email || 'admin@crm.com'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 flex-shrink-0 p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 group"
            title="Logout"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar