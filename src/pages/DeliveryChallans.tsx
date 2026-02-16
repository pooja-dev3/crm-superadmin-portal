import React, { useState, useEffect } from 'react'
import { Search, Eye, Truck, CheckCircle, Clock, AlertCircle, X, Plus, Edit, Trash2 } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import AddDeliveryChallanModal from '../components/AddDeliveryChallanModal'
import EditDeliveryChallanModal from '../components/EditDeliveryChallanModal'
import ApiStatusIndicator from '../components/ApiStatusIndicator'

interface DeliveryChallanItem {
  id: string
  challanNumber: string
  company: string
  orderId: string
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)

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
        } else {
          // Calculate pagination locally
          const total = challansData.length
          const lastPage = Math.ceil(total / itemsPerPage)
          setCurrentPage(page)
          setTotalPages(lastPage)
          setTotalItems(total)
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
    // If we have backend pagination data, use it directly
    if (totalItems > 0 && totalPages > 1) {
      return filteredChallans // Backend already paginated, return as-is
    }
    // Otherwise, apply local pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredChallans.slice(startIndex, endIndex)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      fetchChallans(page) // Fetch new page data from backend
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
  }

  const handleDeleteChallan = async (challanId: string, challanNumber: string) => {
    if (window.confirm(`Are you sure you want to delete delivery challan "${challanNumber}"? This action cannot be undone.`)) {
      try {
        const response = await superadminApi.deleteDeliveryChallan(parseInt(challanId)) as { success: boolean }
        if (response.success) {
          alert('Delivery challan deleted successfully')
          fetchChallans()
        } else {
          alert('Failed to delete delivery challan: ' + ((response as any).message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error deleting delivery challan:', error)
        alert('Failed to delete delivery challan. Please try again.')
      }
    }
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
            View all delivery challans across all companies in the system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ApiStatusIndicator />
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
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Challan Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedData().filter(challan => challan).map((challan) => (
                <tr key={challan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {challan.challanNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {challan.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {challan.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      challan.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : challan.status === 'in_transit'
                        ? 'bg-blue-200 text-blue-900'
                        : challan.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getStatusIcon(challan.status)}
                      <span className="ml-1">{challan.status ? challan.status.replace('_', ' ') : 'Unknown'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(challan.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {challan.deliveryDate ? new Date(challan.deliveryDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewChallan(challan.id)}
                      className="text-blue-900 hover:text-blue-800 p-1 mr-1"
                      title="View Challan"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditChallan(challan)}
                      className="text-blue-600 hover:text-blue-700 p-1 mr-1"
                      title="Edit Challan"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChallan(challan.id, challan.challanNumber)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete Challan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                    {Math.min(currentPage * itemsPerPage, filteredChallans.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredChallans.length}</span> results
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
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedChallan.status === 'delivered'
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
    </div>
  )
}

export default DeliveryChallans