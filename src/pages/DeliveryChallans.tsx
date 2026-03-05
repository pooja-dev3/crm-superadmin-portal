import React, { useState, useEffect, useRef } from 'react'
import { Search, Eye, Truck, CheckCircle, Clock, AlertCircle, X, Plus, Edit, Trash2, MoreVertical } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import AddDeliveryChallanModal from '../components/AddDeliveryChallanModal'
import EditDeliveryChallanModal from '../components/EditDeliveryChallanModal'
import ApiStatusIndicator from '../components/ApiStatusIndicator'
import NotificationModal, { NotificationType } from '../components/NotificationModal'
import ConfirmModal from '../components/ConfirmModal'

interface DeliveryChallanItem {
  id: string
  challanNumber: string
  company: string
  orderId: string
  quantity?: number
  inward?: string
  remaining_quantity?: number
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  createdDate: string
  deliveryDate?: string
}

const DeliveryChallans: React.FC = () => {
  const [challans, setChallans] = useState<any[]>([])
  const [filteredChallans, setFilteredChallans] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companies, setCompanies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChallan, setSelectedChallan] = useState<any | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; challanId: string | null; challanNumber: string }>({ isOpen: false, challanId: null, challanNumber: '' })
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Notification state
  const [showNotification, setShowNotification] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>('success')
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)
  const [isBackendPaginated, setIsBackendPaginated] = useState(false)

  // Helper function to show notifications
  const showNotificationModal = (type: NotificationType, title: string, message: string) => {
    setNotificationType(type)
    setNotificationTitle(title)
    setNotificationMessage(message)
    setShowNotification(true)
  }

  const fetchChallans = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await superadminApi.getDeliveryChallans(page) as { success: boolean; data: any; pagination?: any }
      console.log('Delivery Challans API Response:', response)

      // Handle real API response structure
      if (response.success && response.data) {
        let challansData: DeliveryChallanItem[] = []

        if (Array.isArray(response.data)) {
          // Real API returns simple array: { success: true, data: [...] }
          challansData = response.data.map((challan: any) => ({
            id: challan.id.toString(),
            challanNumber: challan.challan_no,
            company: challan.comp_name || challan.to || '',
            orderId: challan.part_no,
            status: challan.status || 'pending',
            createdDate: challan.created_at, // Use created_at for sorting
            deliveryDate: challan.challan_date,
            driverName: challan.signature || '',
            driverContactNumber: '',
            notes: challan.notes || '',
            customerName: challan.customer?.name || '',
            partDescription: challan.part_description || '',
            quantity: challan.quantity || 0,
            unitRate: challan.unit_rate || '0.00',
            total: challan.total || '0.00'
          }))
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Paginated response: { success: true, data: { data: [...] } }
          challansData = response.data.data.map((challan: any) => ({
            id: challan.id.toString(),
            challanNumber: challan.challan_no,
            company: challan.comp_name || challan.to || '',
            orderId: challan.part_no,
            status: challan.status || 'pending',
            createdDate: challan.created_at, // Use created_at for sorting
            deliveryDate: challan.challan_date,
            driverName: challan.signature || '',
            driverContactNumber: '',
            notes: challan.notes || '',
            customerName: challan.customer?.name || '',
            partDescription: challan.part_description || '',
            quantity: challan.quantity || 0,
            unitRate: challan.unit_rate || '0.00',
            total: challan.total || '0.00'
          }))
        }

        setChallans(challansData)

        // Sort by created date (newest first) for both paginated and non-paginated responses
        challansData.sort((a, b) => {
          const dateA = new Date(a.createdDate)
          const dateB = new Date(b.createdDate)
          return dateB.getTime() - dateA.getTime() // Newest first
        })

        setFilteredChallans(challansData)

        // Handle pagination from backend if available, otherwise calculate locally
        if (response.pagination) {
          setCurrentPage(response.pagination.current_page)
          setTotalPages(response.pagination.last_page)
          setTotalItems(response.pagination.total)
          setIsBackendPaginated(true)
        } else {
          // Calculate pagination locally
          const total = challansData.length
          const lastPage = Math.ceil(total / itemsPerPage)
          setCurrentPage(page)
          setTotalPages(lastPage)
          setTotalItems(total)
          setIsBackendPaginated(false)
        }

        // Extract unique companies
        const uniqueCompanies = Array.from(new Set(challansData.filter(challan => challan && challan.company).map(challan => challan.company)))
        setCompanies(uniqueCompanies)
      } else {
        setChallans([])
        setFilteredChallans([])
        setCompanies([])
        setCurrentPage(1)
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching delivery challans:', error)
      setChallans([])
      setFilteredChallans([])
      setCompanies([])
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChallans()
  }, [])

  // Get paginated data for current page
  const getPaginatedData = () => {
    if (isBackendPaginated) {
      // Backend pagination - return data as-is (already paginated)
      return filteredChallans
    } else {
      // Local pagination - slice the filtered data
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      return filteredChallans.slice(startIndex, endIndex)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)

      if (isBackendPaginated) {
        // Backend pagination - fetch new page data from API
        fetchChallans(page)
      } else {
        // Local pagination - just update the page state
        // Data will be filtered and sliced by getPaginatedData()
      }
    }
  }

  useEffect(() => {
    let filtered = challans

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(challan =>
        challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challan.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challan.company.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(challan => challan.company === companyFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(challan => challan.status === statusFilter)
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdDate)
      const dateB = new Date(b.createdDate)
      return dateB.getTime() - dateA.getTime() // Newest first
    })

    setFilteredChallans(filtered)

    // Reset to first page when filters change
    setCurrentPage(1)
  }, [challans, searchTerm, companyFilter, statusFilter])

  const handleViewChallan = (challanId: string) => {
    const challan = challans.find(c => c.id === challanId)
    if (challan) {
      setSelectedChallan(challan)
      setShowViewModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowViewModal(false)
    setSelectedChallan(null)
  }

  const handleAddSuccess = () => {
    fetchChallans()
    showNotificationModal('success', 'Success', 'Delivery challan created successfully!')
  }

  const handleEditChallan = (challan: DeliveryChallanItem) => {
    setSelectedChallan(challan)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedChallan(null)
  }

  const handleEditSuccess = () => {
    fetchChallans()
    showNotificationModal('success', 'Success', 'Delivery challan updated successfully!')
  }

  const handleDeleteChallan = (challanId: string, challanNumber: string) => {
    setDeleteConfirm({
      isOpen: true,
      challanId,
      challanNumber
    })
  }

  const confirmDeleteChallan = async () => {
    if (deleteConfirm.challanId) {
      try {
        const response = await superadminApi.deleteDeliveryChallan(parseInt(deleteConfirm.challanId)) as { success: boolean }
        if (response.success) {
          showNotificationModal('success', 'Success', 'Delivery challan deleted successfully!')
          fetchChallans()
        } else {
          showNotificationModal('error', 'Error', 'Failed to delete delivery challan. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting delivery challan:', error)
        showNotificationModal('error', 'Error', 'An error occurred while deleting the delivery challan.')
      }
    }
    setDeleteConfirm({ isOpen: false, challanId: null, challanNumber: '' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_transit':
        return <Truck className="w-4 h-4 text-blue-900" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Delivery Challans</h1>
          <p className="mt-1 text-sm text-gray-600">
            View all delivery challans across all companies in system • Total: {totalItems || challans.length}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* <ApiStatusIndicator /> */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Delivery Challan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search challans..."
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
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery Challans Table */}
      <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
        <div className="overflow-x-auto custom-scrollbar relative max-h-[600px]">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16 whitespace-nowrap">
                  Sr No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Challan Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Qty / In / Rem
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Dates (Create/Deliv)
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50/90 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {getPaginatedData().filter(challan => challan).map((challan, index) => (
                <tr key={challan.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400 group-hover:text-blue-500 transition-colors">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {challan.challanNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                    {challan.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs tracking-wider border border-gray-200">{challan.orderId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded" title="Total Quantity">{challan.quantity || '-'}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100" title="Inward">{challan.inward || '-'}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100" title="Remaining">{challan.remaining_quantity || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border ${challan.status === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : challan.status === 'in_transit'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : challan.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      {getStatusIcon(challan.status)}
                      <span className="ml-1.5">{challan.status ? challan.status.replace('_', ' ').charAt(0).toUpperCase() + challan.status.replace('_', ' ').slice(1) : 'Unknown'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-600">
                      {new Date(challan.createdDate).toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {challan.deliveryDate ? new Date(challan.deliveryDate).toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' }) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors">
                    <div className="relative flex justify-end items-center" ref={activeDropdown === challan.id ? dropdownRef : null}>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === challan.id ? null : challan.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === challan.id && (
                        <div className="absolute right-8 top-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in-scale origin-top-right overflow-hidden">
                          <div className="py-1">
                            <button
                              onClick={() => { handleViewChallan(challan.id); setActiveDropdown(null) }}
                              className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              <Eye className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                              View Challan
                            </button>
                            <button
                              onClick={() => { handleEditChallan(challan); setActiveDropdown(null) }}
                              className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                            >
                              <Edit className="mr-3 h-4 w-4 text-gray-400 group-hover:text-yellow-500" />
                              Edit Challan
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => { handleDeleteChallan(challan.id, challan.challanNumber); setActiveDropdown(null) }}
                              className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600" />
                              Delete Challan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-100 sm:px-6 shadow-sm rounded-b-xl border-t-0 -mt-px relative z-20">
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
                    {isBackendPaginated ? Math.min(currentPage * itemsPerPage, totalItems) : Math.min(currentPage * itemsPerPage, filteredChallans.length)}
                  </span>{' '}
                  of <span className="font-medium">{isBackendPaginated ? totalItems : filteredChallans.length}</span> results
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  ))}

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

        {getPaginatedData().length === 0 && filteredChallans.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No delivery challans found on this page.</p>
          </div>
        )}

        {filteredChallans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No delivery challans found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* View Challan Modal */}
      {showViewModal && selectedChallan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={handleCloseModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delivery Challan Details
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Challan Number</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedChallan.challanNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Order ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedChallan.orderId}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Company</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedChallan.company}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedChallan.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : selectedChallan.status === 'in_transit'
                            ? 'bg-blue-200 text-blue-900'
                            : selectedChallan.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                          {getStatusIcon(selectedChallan.status)}
                          <span className="ml-1">{selectedChallan.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedChallan.createdDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedChallan.deliveryDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Delivery Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedChallan.deliveryDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Additional Information</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <p><strong>Tracking:</strong> Available in system</p>
                        <p><strong>Documents:</strong> Invoice attached</p>
                        <p><strong>Priority:</strong> Normal</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Delivery Challan Modal */}
      <AddDeliveryChallanModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Delivery Challan Modal */}
      {showEditModal && (
        <EditDeliveryChallanModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          challan={selectedChallan}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, challanId: null, challanNumber: '' })}
        onConfirm={confirmDeleteChallan}
        title="Delete Delivery Challan"
        message={`Are you sure you want to delete delivery challan "${deleteConfirm.challanNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

export default DeliveryChallans