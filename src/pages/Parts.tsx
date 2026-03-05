import React, { useState, useEffect } from 'react'
import { Search, Plus, Eye, Edit, Trash2, Package, Building, Calendar, Weight, FileText, Tag, Clock } from 'lucide-react'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredParts.map((part, index) => (
          <div key={part.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group overflow-hidden relative flex flex-col h-full animate-fade-in-scale">

            {/* Index Badge */}
            <div className="absolute top-4 right-4 z-10 transition-transform duration-300 group-hover:scale-105">
              <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-gray-500 bg-gray-100/80 backdrop-blur-sm rounded-full border border-gray-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors shadow-sm">
                #{index + 1}
              </span>
            </div>

            <div className="p-6 flex-grow flex flex-col">
              {/* Header section */}
              <div className="flex items-start mb-5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                  <Package className="h-7 w-7 drop-shadow-sm" />
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors mb-1.5" title={part.part_description}>
                  {part.part_description}
                </h3>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center">
                  Part ID <span className="mx-1.5 opacity-50">•</span> {part.id}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-to-r from-gray-100 via-gray-200 to-transparent my-5"></div>

              {/* Details grid */}
              <div className="space-y-3.5 mt-auto">
                <div className="flex items-center text-sm group/item">
                  <div className="w-8 flex justify-center group-hover/item:scale-110 transition-transform"><Building className="h-4 w-4 text-gray-400 group-hover/item:text-blue-500 transition-colors" /></div>
                  <div className="flex-1 truncate">
                    <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-2">Client</span>
                    <span className="font-semibold text-gray-800">{part.customer.name}</span>
                  </div>
                </div>

                <div className="flex items-center text-sm group/item">
                  <div className="w-8 flex justify-center group-hover/item:scale-110 transition-transform"><FileText className="h-4 w-4 text-gray-400 group-hover/item:text-blue-500 transition-colors" /></div>
                  <div className="flex-1 truncate">
                    <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-2">Drawing</span>
                    <span className="font-bold text-gray-700 bg-gray-50 px-2.5 py-0.5 rounded text-xs tracking-wider border border-gray-200/60 shadow-sm">{part.drawing_no}</span>
                  </div>
                </div>

                {part.rev_no && (
                  <div className="flex items-center text-sm group/item">
                    <div className="w-8 flex justify-center group-hover/item:scale-110 transition-transform"><Tag className="h-4 w-4 text-gray-400 group-hover/item:text-blue-500 transition-colors" /></div>
                    <div className="flex-1 truncate">
                      <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-2">Revision</span>
                      <span className="font-semibold text-gray-700 text-xs px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">{part.rev_no}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="bg-gray-50/80 border-t border-gray-100 p-4 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-xs font-semibold text-gray-500">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <span>Created {new Date(part.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {part.lead_time && (
                  <div className="flex items-center text-[11px] font-bold text-amber-700 bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200/60 shadow-sm">
                    <Clock className="h-3 w-3 mr-1 opacity-70" />
                    {part.lead_time} days lead
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                <button
                  onClick={() => handleViewPart(part)}
                  className="flex-1 flex justify-center items-center px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 border border-transparent rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-600/20 transition-all duration-200 shadow-sm mr-3"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => handleEditPart(part)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200 border border-transparent hover:border-amber-200 hover:shadow-sm"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePart(part.id, part.part_description)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200 hover:shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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

