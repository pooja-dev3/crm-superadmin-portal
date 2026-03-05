import React, { useState, useEffect } from 'react'
import { Search, Plus, Eye, Edit, Trash2, Package, Building, Calendar, Weight } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { PartWithCustomer, CustomerWithParts } from '../types/api'
import AddPartModal from '../components/AddPartModal'
import EditPartModal from '../components/EditPartModal'
import ViewPartModal from '../components/ViewPartModal'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

const Parts: React.FC = () => {
  const [parts, setParts] = useState<any[]>([])
  const [filteredParts, setFilteredParts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPart, setSelectedPart] = useState<any | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; partId: number | null; partDescription: string }>({ isOpen: false, partId: null, partDescription: '' })
  const { addToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = parts

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.part_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.drawing_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.raw_material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply customer filter
    if (customerFilter !== 'all') {
      filtered = filtered.filter(part => part.customer_id === parseInt(customerFilter))
    }

    setFilteredParts(filtered)
  }, [parts, searchTerm, customerFilter])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [partsResponse, customersResponse] = await Promise.all([
        superadminApi.getParts().catch(() => ({ success: false, data: [] })),
        superadminApi.getCustomers().catch(() => ({ success: false, data: [] }))
      ]) as [{ success: boolean; data: any }, { success: boolean; data: any }]

      // Handle parts response - check if it's paginated or direct array
      if (partsResponse.success) {
        let partsData: PartWithCustomer[] = []
        if (Array.isArray(partsResponse.data)) {
          // Direct array response
          partsData = partsResponse.data.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        } else if (partsResponse.data && typeof partsResponse.data === 'object' && 'data' in partsResponse.data && Array.isArray((partsResponse.data as any).data)) {
          // Paginated response
          partsData = (partsResponse.data as any).data.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        setParts(partsData)
        setFilteredParts(partsData)
      } else {
        setParts([])
        setFilteredParts([])
      }

      // Handle customers response - check if it's paginated or direct array
      if (customersResponse.success) {
        let customersData: CustomerWithParts[] = []
        if (Array.isArray(customersResponse.data)) {
          // Direct array response
          customersData = customersResponse.data
        } else if (customersResponse.data && typeof customersResponse.data === 'object' && 'data' in customersResponse.data && Array.isArray((customersResponse.data as any).data)) {
          // Paginated response
          customersData = (customersResponse.data as any).data
        }
        setCustomers(customersData)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setParts([])
      setFilteredParts([])
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPart = (part: PartWithCustomer) => {
    setSelectedPart(part)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedPart(null)
  }

  const handleAddSuccess = () => {
    fetchData()
  }

  const handleEditPart = (part: PartWithCustomer) => {
    setSelectedPart(part)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedPart(null)
  }

  const handleEditSuccess = () => {
    fetchData()
  }

  const handleDeletePart = (partId: number, partDescription: string) => {
    setDeleteConfirm({
      isOpen: true,
      partId,
      partDescription
    })
  }

  const confirmDeletePart = async () => {
    if (deleteConfirm.partId) {
      try {
        const response = await superadminApi.deletePart(deleteConfirm.partId) as { success: boolean }
        if (response.success) {
          // Refresh parts list
          await fetchData()
          addToast('Part deleted successfully', 'success')
        } else {
          addToast('Failed to delete part', 'error')
        }
      } catch (error) {
        console.error('Error deleting part:', error)
        addToast('Failed to delete part', 'error')
      }
    }
    setDeleteConfirm({ isOpen: false, partId: null, partDescription: '' })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all parts and their specifications • Total: {parts.length}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search parts by description, drawing, material, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
            >
              <option value="all">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParts.map((part, index) => (
          <div key={part.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="absolute top-2 right-2 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
              # {index + 1}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                    <Package className="h-6 w-6 text-green-900" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{part.part_description}</h3>
                    <p className="text-sm text-gray-500">ID: {part.id}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleViewPart(part)}
                    className="p-1 text-gray-400 hover:text-blue-900 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{part.customer.name}</p>
                </div>

                <div className="flex items-center">
                  <Package className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Drawing: {part.drawing_no}</p>
                </div>

                {part.rev_no && (
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">Rev: {part.rev_no}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      {new Date(part.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {part.lead_time && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-xs text-gray-500">
                        {part.lead_time} days
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <>
                    <button
                      onClick={() => handleEditPart(part)}
                      className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit Part"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePart(part.id, part.part_description)}
                      className="p-1 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete Part"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredParts.length === 0 && (
        <EmptyState
          title="No parts found"
          message={searchTerm || customerFilter !== 'all' ? 'Try adjusting your search terms' : 'Get started by adding a new part'}
          icon={Package}
        />
      )}

      {/* View Part Modal */}
      <ViewPartModal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        part={selectedPart}
      />

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Part Modal */}
      {showEditModal && (
        <EditPartModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          part={selectedPart}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, partId: null, partDescription: '' })}
        onConfirm={confirmDeletePart}
        title="Delete Part"
        message={`Are you sure you want to delete part "${deleteConfirm.partDescription}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

export default Parts

