import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Edit, Trash2, Users, Building, Phone, FileText, X, MoreVertical } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import AddCustomerModal from '../components/AddCustomerModal'
import EditCustomerModal from '../components/EditCustomerModal'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../contexts/ToastContext'

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; customerId: number | null; customerName: string }>({ isOpen: false, customerId: null, customerName: '' })
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

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
  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    let filtered = customers

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.gst_no.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCustomers(filtered)
  }, [customers, searchTerm])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const response = await superadminApi.getCustomers() as { success: boolean; data: any }
      console.log('Customers API Response:', response)

      // Handle both paginated and simple array responses
      if (response.success) {
        if (Array.isArray(response.data)) {
          // Real API returns simple array: { success: true, data: [...] }
          const sortedCustomers = response.data.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          setCustomers(sortedCustomers)
          setFilteredCustomers(sortedCustomers)
        } else if (response.data && Array.isArray(response.data.data)) {
          // Mock API returns paginated: { success: true, data: { data: [...] } }
          const sortedCustomers = response.data.data.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          setCustomers(sortedCustomers)
          setFilteredCustomers(sortedCustomers)
        } else {
          setCustomers([])
          setFilteredCustomers([])
        }
      } else {
        setCustomers([])
        setFilteredCustomers([])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
      setFilteredCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSuccess = () => {
    fetchCustomers()
    setShowAddModal(false)
  }

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedCustomer(null)
  }

  const handleEditSuccess = () => {
    fetchCustomers()
  }

  const handleDeleteCustomer = (customerId: number, customerName: string) => {
    setDeleteConfirm({
      isOpen: true,
      customerId,
      customerName
    })
  }

  const confirmDeleteCustomer = async () => {
    if (deleteConfirm.customerId) {
      try {
        const response = await superadminApi.deleteCustomer(deleteConfirm.customerId) as { success: boolean }
        if (response.success) {
          // Refresh customers list
          await fetchCustomers()
          addToast('Customer deleted successfully', 'success')
        } else {
          addToast('Failed to delete customer', 'error')
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        addToast('Failed to delete customer', 'error')
      }
    }
    setDeleteConfirm({ isOpen: false, customerId: null, customerName: '' })
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
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage all customers in the system • Total: {customers.length}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customers by name, address, contact, or GST..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
          <div className="overflow-x-auto custom-scrollbar relative max-h-[600px]">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16 whitespace-nowrap">
                    Sr No.
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    GST Number
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Parts Count
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50/90 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400 group-hover:text-blue-500 transition-colors">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{customer.name}</div>
                          <div className="text-sm text-gray-500 max-w-[200px] truncate" title={customer.address}>{customer.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="text-sm font-medium text-gray-600">{customer.contact_no}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="text-sm font-medium text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs tracking-wider border border-gray-200">{customer.gst_no || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-600">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-200">{customer.parts_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
                      {new Date(customer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors">
                      <div className="relative flex justify-end items-center" ref={activeDropdown === customer.id ? dropdownRef : null}>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === customer.id ? null : customer.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === customer.id && (
                          <div className="absolute right-8 top-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in-scale origin-top-right overflow-hidden">
                            <div className="py-1">
                              <button
                                onClick={() => { handleEditCustomer(customer); setActiveDropdown(null) }}
                                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                              >
                                <Edit className="mr-3 h-4 w-4 text-gray-400 group-hover:text-yellow-500" />
                                Edit Customer
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => { handleDeleteCustomer(customer.id, customer.name); setActiveDropdown(null) }}
                                className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600" />
                                Delete Customer
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
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found matching your criteria.</p>
          </div>
        )}


        {/* Add Customer Modal */}
        {showAddModal && (
          <AddCustomerModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
          />
        )}

        {/* Edit Customer Modal */}
        {showEditModal && (
          <EditCustomerModal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            onSuccess={handleEditSuccess}
            customer={selectedCustomer}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, customerId: null, customerName: '' })}
          onConfirm={confirmDeleteCustomer}
          title="Delete Customer"
          message={`Are you sure you want to delete customer "${deleteConfirm.customerName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

      </div>
    </>
  )
}

export default Customers
