import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, UserX, Key, CheckCircle, XCircle } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import AddAdminModal from '../components/AddAdminModal'
import EditAdminModal from '../components/EditAdminModal'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../contexts/ToastContext'

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; adminId: number | null; adminName: string }>({ isOpen: false, adminId: null, adminName: '' })
  const { addToast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)
  const [isBackendPaginated, setIsBackendPaginated] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await superadminApi.getCompanyUsers(page) as { success: boolean; data: any; pagination?: any }
      console.log('Company Admins API Response:', response)

      // Handle real API structure and mock paginated structure
      let adminData: any[] = []

      if (response.success) {
        if (Array.isArray(response.data)) {
          // Real API returns simple array in response.data
          adminData = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          // Mock API returns paginated structure
          adminData = response.data.data
        }
      }

      // Sort by created_at date (latest first)
      adminData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setAdmins(adminData)
      setFilteredAdmins(adminData)

      // Handle pagination from backend if available, otherwise calculate locally
      if (response.data && response.data.current_page) {
        setCurrentPage(response.data.current_page)
        setTotalPages(response.data.last_page || Math.ceil((response.data.total || 0) / (response.data.per_page || itemsPerPage)))
        setTotalItems(response.data.total || adminData.length)
        setIsBackendPaginated(true)
      } else if (response.pagination) {
        setCurrentPage(response.pagination.current_page)
        setTotalPages(response.pagination.last_page)
        setTotalItems(response.pagination.total)
        setIsBackendPaginated(true)
      } else {
        // Calculate pagination locally
        const total = adminData.length
        const lastPage = Math.ceil(total / itemsPerPage)
        setCurrentPage(page)
        setTotalPages(lastPage > 0 ? lastPage : 1)
        setTotalItems(total)
        setIsBackendPaginated(false)
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
      setAdmins([])
      setFilteredAdmins([])
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)
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

    // Reset to first page when filters change
    setCurrentPage(1)
  }, [admins, searchTerm, statusFilter, companyFilter])

  // Get paginated data for current page
  const getPaginatedData = () => {
    if (isBackendPaginated) {
      // Backend pagination - return data as-is
      return filteredAdmins
    } else {
      // Local pagination - slice the filtered data
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      return filteredAdmins.slice(startIndex, endIndex)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)

      if (isBackendPaginated) {
        // Backend pagination - fetch new page data
        fetchAdmins(page)
      }
    }
  }

  const handleToggleStatus = async (adminId: number) => {
    const admin = admins.find(a => a.id === adminId)
    const currentStatus = admin?.is_active

    try {
      const response = await superadminApi.updateCompanyUser(adminId, { is_active: !currentStatus }) as { success: boolean }
      if (response.success) {
        // Refresh admins list
        await fetchAdmins()
        addToast(`Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success')
      } else {
        addToast('Failed to update admin status', 'error')
      }
    } catch (error) {
      console.error('Error toggling admin status:', error)
      addToast('Failed to update admin status', 'error')
    }
  }

  const handleResetPassword = async (adminId: number) => {
    const newPassword = prompt('Enter new password:')
    if (newPassword) {
      try {
        const response = await superadminApi.updateCompanyUser(adminId, { password: newPassword }) as { success: boolean }
        if (response.success) {
          addToast('Password reset successfully', 'success')
        } else {
          addToast('Failed to reset password', 'error')
        }
      } catch (error) {
        console.error('Error resetting password:', error)
        addToast('Failed to reset password', 'error')
      }
    }
  }

  const handleEditAdmin = (admin: any) => {
    setSelectedAdmin(admin)
    setShowEditModal(true)
  }

  const handleDeleteAdmin = (adminId: number, adminName: string) => {
    setDeleteConfirm({
      isOpen: true,
      adminId,
      adminName
    })
  }

  const confirmDeleteAdmin = async () => {
    if (deleteConfirm.adminId) {
      try {
        const response = await superadminApi.deleteCompanyUser(deleteConfirm.adminId) as { success: boolean }
        if (response.success) {
          await fetchAdmins()
          addToast('Admin deleted successfully', 'success')
        } else {
          addToast('Failed to delete admin', 'error')
        }
      } catch (error) {
        console.error('Error deleting admin:', error)
        addToast('Failed to delete admin', 'error')
      }
    }
    setDeleteConfirm({ isOpen: false, adminId: null, adminName: '' })
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
                    Sr No.
                  </th>
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
                {getPaginatedData().map((admin: any, index: number) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {admin.name.split(' ').map((n: string) => n[0]).join('')}
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.role === 'admin'
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.is_active
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
                          onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Admin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin.id)}
                          className={`p-1 ${admin.is_active
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {isBackendPaginated ? Math.min(currentPage * itemsPerPage, totalItems) : Math.min(currentPage * itemsPerPage, filteredAdmins.length)}
                    </span>{' '}
                    of <span className="font-medium">{isBackendPaginated ? totalItems : filteredAdmins.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        totalPages <= 7 ||
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, adminId: null, adminName: '' })}
          onConfirm={confirmDeleteAdmin}
          title="Delete Admin"
          message={`Are you sure you want to delete admin "${deleteConfirm.adminName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </>
  )
}

export default CompanyAdmins