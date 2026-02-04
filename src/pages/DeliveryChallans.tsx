import React, { useState, useEffect } from 'react'
import { Search, Eye, Truck, CheckCircle, Clock, AlertCircle, X } from 'lucide-react'

interface DeliveryChallan {
  id: string
  challanNumber: string
  company: string
  orderId: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  createdDate: string
  deliveryDate?: string
}

const DeliveryChallans: React.FC = () => {
  const [challans, setChallans] = useState<DeliveryChallan[]>([])
  const [filteredChallans, setFilteredChallans] = useState<DeliveryChallan[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companies, setCompanies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    // Mock API call - replace with actual API
    const fetchChallans = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock data
        const mockChallans: DeliveryChallan[] = [
          {
            id: '1',
            challanNumber: 'DC-001',
            company: 'TechCorp Solutions',
            orderId: 'ORD-001',
            status: 'delivered',
            createdDate: '2024-01-21',
            deliveryDate: '2024-01-23'
          },
          {
            id: '2',
            challanNumber: 'DC-002',
            company: 'GlobalTech Inc.',
            orderId: 'ORD-002',
            status: 'in_transit',
            createdDate: '2024-01-19'
          },
          {
            id: '3',
            challanNumber: 'DC-003',
            company: 'InnovateLabs',
            orderId: 'ORD-003',
            status: 'pending',
            createdDate: '2024-01-17'
          },
          {
            id: '4',
            challanNumber: 'DC-004',
            company: 'DataFlow Systems',
            orderId: 'ORD-004',
            status: 'delivered',
            createdDate: '2024-01-16',
            deliveryDate: '2024-01-18'
          },
          {
            id: '5',
            challanNumber: 'DC-005',
            company: 'CloudSync Ltd.',
            orderId: 'ORD-005',
            status: 'cancelled',
            createdDate: '2024-01-15'
          }
        ]

        const uniqueCompanies = [...new Set(mockChallans.map(challan => challan.company))]
        setCompanies(uniqueCompanies)
        setChallans(mockChallans)
        setFilteredChallans(mockChallans)
      } catch (error) {
        console.error('Error fetching delivery challans:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChallans()
  }, [])

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

    setFilteredChallans(filtered)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Global Delivery Challans</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all delivery challans across all companies in the system
        </p>
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
              {filteredChallans.map((challan) => (
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
                      <span className="ml-1">{challan.status.replace('_', ' ')}</span>
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
                      className="text-blue-900 hover:text-blue-800 p-1"
                      title="View Challan"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
    </div>
  )
}

export default DeliveryChallans