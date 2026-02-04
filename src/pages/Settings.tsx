import React, { useState } from 'react'
import {
  Users,
  Shield,
  FileText,
  Lock,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
}

interface AuditLog {
  id: string
  user: string
  action: string
  resource: string
  timestamp: string
  ipAddress: string
  status: 'success' | 'failed'
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles')
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)

  // Mock data
  const roles: Role[] = [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access',
      permissions: ['all'],
      userCount: 1
    },
    {
      id: '2',
      name: 'Company Admin',
      description: 'Manage company operations',
      permissions: ['manage_company', 'view_reports', 'manage_users'],
      userCount: 45
    },
    {
      id: '3',
      name: 'Viewer',
      description: 'Read-only access',
      permissions: ['view'],
      userCount: 23
    }
  ]

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      user: 'Super Admin',
      action: 'Login',
      resource: 'System',
      timestamp: '2024-01-28T10:30:00Z',
      ipAddress: '192.168.1.100',
      status: 'success'
    },
    {
      id: '2',
      user: 'john@techcorp.com',
      action: 'Create Company',
      resource: 'Companies',
      timestamp: '2024-01-27T14:15:00Z',
      ipAddress: '10.0.0.50',
      status: 'success'
    },
    {
      id: '3',
      user: 'admin@globaltech.com',
      action: 'Failed Login',
      resource: 'Authentication',
      timestamp: '2024-01-26T09:45:00Z',
      ipAddress: '203.0.113.1',
      status: 'failed'
    }
  ]

  const permissions = [
    { id: 'manage_company', label: 'Manage Company', description: 'Create, edit, and delete companies' },
    { id: 'manage_users', label: 'Manage Users', description: 'Add, edit, and remove users' },
    { id: 'view_reports', label: 'View Reports', description: 'Access system reports and analytics' },
    { id: 'manage_orders', label: 'Manage Orders', description: 'Process and manage orders' },
    { id: 'manage_challans', label: 'Manage Delivery Challans', description: 'Handle delivery documentation' },
    { id: 'system_settings', label: 'System Settings', description: 'Modify system configuration' }
  ]

  const tabs = [
    { id: 'roles', label: 'Roles', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'security', label: 'Security', icon: Lock }
  ]

  const handleAddRole = () => {
    setShowAddRoleModal(true)
  }

  const handleEditRole = (roleId: string) => {
    console.log('Edit role:', roleId)
  }

  const handleDeleteRole = (roleId: string) => {
    console.log('Delete role:', roleId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage system roles, permissions, and security settings
        </p>
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
          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">User Roles</h3>
                <button
                  onClick={handleAddRole}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-900 hover:bg-blue-800"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Role
                </button>
              </div>

              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{role.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {role.userCount} users assigned
                          </span>
                          <span className="text-sm text-gray-500">
                            {role.permissions.length} permissions
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRole(role.id)}
                          className="p-2 text-gray-400 hover:text-blue-900"
                          title="Edit Role"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete Role"
                          disabled={role.name === 'Super Admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">System Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {permissions.map((permission) => (
                  <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-blue-900" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">{permission.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit-logs' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Audit Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.user}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.resource}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        Password Policy
                      </h4>
                      <p className="mt-2 text-sm text-yellow-700">
                        Enforce strong passwords with minimum 8 characters, uppercase, lowercase, and numbers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Security Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Require 2FA for all admin accounts</p>
                      </div>
                        <button className="bg-blue-900 text-white px-3 py-1 rounded text-sm">
                        Enable
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Session Timeout</label>
                        <p className="text-xs text-gray-500">Auto-logout after 30 minutes of inactivity</p>
                      </div>
                      <span className="text-sm text-gray-500">30 minutes</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Login Attempts</label>
                        <p className="text-xs text-gray-500">Maximum failed login attempts before lockout</p>
                      </div>
                      <span className="text-sm text-gray-500">5 attempts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings