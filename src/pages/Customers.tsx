import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Users, Building, Phone, FileText, X } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import AddCustomerModal from '../components/AddCustomerModal'
import EditCustomerModal from '../components/EditCustomerModal'

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

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

  const handleDeleteCustomer = async (customerId: number, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) {
      try {
        const response = await superadminApi.deleteCustomer(customerId) as { success: boolean }
        if (response.success) {
          // Refresh customers list
          await fetchCustomers()
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        alert('Failed to delete customer')
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
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage all customers in the system
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
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parts Count
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Building className="h-8 w-8 text-blue-900" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="text-sm text-gray-900">{customer.contact_no}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="text-sm text-gray-900">{customer.gst_no}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.parts_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
      </div>

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
    </>
  )
}

export default Customers
