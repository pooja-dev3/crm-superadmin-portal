import React, { useState, useEffect } from 'react'
import { Search, Plus, Eye, Edit, Trash2, Package, Building, Calendar, Weight } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { PartWithCustomer, CustomerWithParts } from '../types/api'
import AddPartModal from '../components/AddPartModal'
import EditPartModal from '../components/EditPartModal'

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

  const handleDeletePart = async (partId: number, partDescription: string) => {
    if (window.confirm(`Are you sure you want to delete part "${partDescription}"? This action cannot be undone.`)) {
      try {
        const response = await superadminApi.deletePart(partId) as { success: boolean }
        if (response.success) {
          // Refresh parts list
          await fetchData()
        }
      } catch (error) {
        console.error('Error deleting part:', error)
        alert('Failed to delete part')
      }
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
        {filteredParts.map((part) => (
          <div key={part.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
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
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No parts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || customerFilter !== 'all' ? 'Try adjusting your search terms' : 'Get started by adding a new part'}
          </p>
        </div>
      )}

      {/* View Part Modal */}
      {showViewModal && selectedPart && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={handleCloseViewModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl leading-6 font-medium text-gray-900">
                    Part Details
                  </h3>
                  <button
                    onClick={handleCloseViewModal}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Part Description</label>
                          <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedPart.part_description}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Drawing Number</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPart.drawing_no}</p>
                        </div>
                        {selectedPart.rev_no && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Revision Number</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.rev_no}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Customer</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPart.customer.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Part ID</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.id}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Created Date</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {new Date(selectedPart.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Specifications */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Technical Specifications</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        {selectedPart.net_wt && (
                          <div className="flex items-center">
                            <Weight className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div>
                              <label className="block text-sm font-medium text-gray-500">Net Weight</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedPart.net_wt}</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedPart.thickness && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Thickness</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.thickness}</p>
                          </div>
                        )}

                        {selectedPart.raw_material && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Raw Material</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.raw_material}</p>
                          </div>
                        )}

                        {selectedPart.tool_information && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Tool Information</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.tool_information}</p>
                          </div>
                        )}

                        {selectedPart.drawing_location && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Drawing Location</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.drawing_location}</p>
                          </div>
                        )}

                        {selectedPart.operation_sequence && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Operation Sequence</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.operation_sequence}</p>
                          </div>
                        )}

                        {selectedPart.lead_time && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Lead Time</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedPart.lead_time} days</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Purchase Order Information */}
                  {(selectedPart.po_no || selectedPart.po_date || selectedPart.po_qty || selectedPart.po_received) && (
                    <div className="space-y-4 lg:col-span-2">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Purchase Order Information</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedPart.po_no && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">PO Number</label>
                                <p className="mt-1 text-sm text-gray-900">{selectedPart.po_no}</p>
                              </div>
                            )}
                            
                            {selectedPart.po_date && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">PO Date</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {new Date(selectedPart.po_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            
                            {selectedPart.po_qty && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">PO Quantity</label>
                                <p className="mt-1 text-sm text-gray-900">{selectedPart.po_qty}</p>
                              </div>
                            )}
                            
                            {selectedPart.po_drg_rev && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">PO Drawing Revision</label>
                                <p className="mt-1 text-sm text-gray-900">{selectedPart.po_drg_rev}</p>
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-500">PO Received</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {selectedPart.po_received ? 'Yes' : 'No'}
                              </p>
                            </div>
                            
                            {selectedPart.reqd_date_as_per_po && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">Required Date as per PO</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {new Date(selectedPart.reqd_date_as_per_po).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {selectedPart.acknowledgement_remarks && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-500">Acknowledgement Remarks</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedPart.acknowledgement_remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={handleCloseViewModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}

export default Parts

