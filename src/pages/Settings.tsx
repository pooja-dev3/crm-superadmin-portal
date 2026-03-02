import React, { useState, useEffect } from 'react'
import {
  Users,
  Shield,
  FileText,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { superadminApi } from '../services'
import { useToast } from '../contexts/ToastContext'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  // State for data
  const [roles, setRoles] = useState<Role[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [systemPermissions, setSystemPermissions] = useState<any[]>([])
  const [securitySettings, setSecuritySettings] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [rolesRes, logsRes, permsRes, settingsRes] = await Promise.allSettled([
        superadminApi.getRoles(),
        superadminApi.getRecentActivities(),
        superadminApi.getPermissions(),
        superadminApi.getSecuritySettings()
      ]) as any[]

      if (rolesRes.status === 'fulfilled' && rolesRes.value.success) {
        setRoles(rolesRes.value.data)
      } else {
        // Fallback or handle error
        console.error('Failed to fetch roles')
      }

      if (logsRes.status === 'fulfilled' && logsRes.value.success) {
        // Map recent activities to AuditLog interface if needed
        const mappedLogs = logsRes.value.data.map((log: any) => ({
          id: log.id,
          user: log.user_name || log.user || 'System',
          action: log.action || log.title,
          resource: log.resource || log.type,
          timestamp: log.created_at || log.timestamp,
          ipAddress: log.ip_address || 'N/A',
          status: log.status === 'failed' ? 'failed' : 'success'
        }))
        setAuditLogs(mappedLogs)
      }

      if (permsRes.status === 'fulfilled' && permsRes.value.success) {
        setSystemPermissions(permsRes.value.data)
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value.success) {
        setSecuritySettings(settingsRes.value.data)
      }
    } catch (err) {
      console.error('Error fetching settings data:', err)
      setError('Failed to load settings data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleUpdateSecuritySetting = async (key: string, value: any) => {
    try {
      const response = await superadminApi.updateSecuritySettings({ [key]: value }) as any
      if (response.success) {
        addToast('Security setting updated', 'success')
        fetchData()
      } else {
        addToast('Failed to update security setting', 'error')
      }
    } catch (err) {
      console.error('Error updating security setting:', err)
      addToast('Error updating security setting', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 text-blue-900 animate-spin" />
        <p className="text-gray-500">Loading settings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Settings</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
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
                </div>

                <div className="space-y-4">
                  {roles.length > 0 ? roles.filter(r => r.name === 'Super Admin').map((role) => (
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
                      </div>
                    </div>
                  )) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">Super Admin</h4>
                          <p className="text-sm text-gray-600 mt-1">Full system access and management</p>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              1 users assigned
                            </span>
                            <span className="text-sm text-gray-500">
                              All permissions
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">System Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(systemPermissions.length > 0 ? systemPermissions : permissions).map((permission: any) => (
                    <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <Shield className="h-5 w-5 text-blue-900" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">{permission.label || permission.name}</h4>
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'success'
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
                        <button
                          onClick={() => handleUpdateSecuritySetting('two_factor_enabled', !(securitySettings?.two_factor_enabled))}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${securitySettings?.two_factor_enabled
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-900 text-white hover:bg-blue-800'
                            }`}
                        >
                          {securitySettings?.two_factor_enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Session Timeout</label>
                          <p className="text-xs text-gray-500">Auto-logout after 30 minutes of inactivity</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{securitySettings?.session_timeout || 30} minutes</span>
                          <button
                            onClick={() => handleUpdateSecuritySetting('session_timeout', 60)}
                            className="text-blue-900 text-sm hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Login Attempts</label>
                          <p className="text-xs text-gray-500">Maximum failed login attempts before lockout</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{securitySettings?.max_login_attempts || 5} attempts</span>
                          <button
                            onClick={() => handleUpdateSecuritySetting('max_login_attempts', 3)}
                            className="text-blue-900 text-sm hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings