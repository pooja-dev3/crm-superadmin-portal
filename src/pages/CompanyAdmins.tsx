import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, UserX, Key, CheckCircle, XCircle } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import AddAdminModal from '../components/AddAdminModal'
import EditAdminModal from '../components/EditAdminModal'

const CompanyAdmins: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await superadminApi.getCompanyUsers() as { success: boolean; data: any }
      console.log('Company Admins API Response:', response)
      
      // Handle real API structure only
      let adminData: any[] = []
      
      if (response.success && Array.isArray(response.data)) {
        // Real API returns simple array in response.data
        adminData = response.data
      }
      
      // Sort by created_at date (latest first)
      adminData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setAdmins(adminData)
      setFilteredAdmins(adminData)
    } catch (error) {
      console.error('Error fetching admins:', error)
      setAdmins([])
      setFilteredAdmins([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = admins

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(admin =>
        (admin.name && admin.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (admin.phone && admin.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (admin.company && admin.company.comp_name && admin.company.comp_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (admin.role && admin.role.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(admin => 
        statusFilter === 'active' ? admin.is_active : !admin.is_active
      )
    }

    // Apply company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(admin => 
        admin.company && admin.company.comp_name === companyFilter
      )
    }

    setFilteredAdmins(filtered)
  }, [admins, searchTerm, statusFilter, companyFilter])

  const handleToggleStatus = async (adminId: number) => {
    const admin = admins.find(a => a.id === adminId)
    const currentStatus = admin?.is_active
    
    try {
      const response = await superadminApi.updateCompanyUser(adminId, { is_active: !currentStatus }) as { success: boolean }
      if (response.success) {
        // Refresh admins list
        await fetchAdmins()
      }
    } catch (error) {
      console.error('Error toggling admin status:', error)
      alert('Failed to update admin status')
    }
  }

  const handleResetPassword = async (adminId: number) => {
    const newPassword = prompt('Enter new password:')
    if (newPassword) {
      try {
        const response = await superadminApi.updateCompanyUser(adminId, { password: newPassword }) as { success: boolean }
        if (response.success) {
          alert('Password reset successfully')
        }
      } catch (error) {
        console.error('Error resetting password:', error)
        alert('Failed to reset password')
      }
    }
  }

  const handleEditAdmin = (admin: any) => {
    setSelectedAdmin(admin)
    setShowEditModal(true)
  }

  const handleDeleteAdmin = async (adminId: number) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        const response = await superadminApi.deleteCompanyUser(adminId) as { success: boolean }
        if (response.success) {
          await fetchAdmins()
        }
      } catch (error) {
        console.error('Error deleting admin:', error)
        alert('Failed to delete admin')
      }
    }
  }

  const handleAddSuccess = async () => {
    setShowAddModal(false)
    await fetchAdmins()
  }

  const handleEditSuccess = async () => {
    setShowEditModal(false)
    setSelectedAdmin(null)
    await fetchAdmins()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Admins</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage all company administrators in the system
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </button>
        </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
            >
              <option value="all">All Companies</option>
              {Array.from(new Set(admins.filter(admin => admin.company).map(admin => admin.company.comp_name)))
                .sort()
                .map(companyName => (
                  <option key={companyName} value={companyName}>
                    {companyName}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {admin.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.company ? admin.company.comp_name : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800'
                        : admin.role === 'supervisor'
                        ? 'bg-purple-100 text-purple-800'
                        : admin.role === 'operator'
                        ? 'bg-gray-100 text-gray-800'
                        : admin.role === 'superadmin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit Admin"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Admin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin.id)}
                        className={`p-1 ${
                          admin.is_active
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No company admins found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <AddAdminModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <EditAdminModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          admin={selectedAdmin}
        />
      )}
      </div>
    </>
  )
}

export default CompanyAdmins