import React, { useState, useEffect } from 'react'
import { Search, Calendar, Eye, Edit, Trash2, Plus, Filter, X } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { Order, OrderDisplay } from '../types/api'
import AddOrderModal from '../components/AddOrderModal'
import EditOrderModal from '../components/EditOrderModal'

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [companies, setCompanies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)
  const [isBackendPaginated, setIsBackendPaginated] = useState(false)

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const response = await superadminApi.getOrders() as { success: boolean; data: any }
      console.log('Orders API Response:', response) // Debug log
      
      // Handle both paginated and simple array responses
      if (response.success) {
        let ordersData: Order[] = []
        
        if (Array.isArray(response.data)) {
          // Real API returns simple array: { success: true, data: [...] }
          ordersData = response.data.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        } else if (response.data && Array.isArray(response.data.data)) {
          // Mock API returns paginated: { success: true, data: { data: [...] } }
          ordersData = response.data.data.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        
        console.log('Orders Data after fetch:', ordersData) // Debug log
        console.log('Orders Data length:', ordersData.length) // Debug log
        
        if (ordersData.length > 0) {
          // Map API response to display format
          const validOrders: OrderDisplay[] = ordersData.map((order: Order) => {
            console.log('Processing order:', order) // Debug log for each order
            return {
              id: order.id.toString(),
              orderNumber: order.po_no,
              company: order.customer?.name || 'Unknown Customer',
              status: order.po_received ? 'completed' : 'pending',
              total: parseFloat(order.price) * order.po_qty,
              createdDate: order.created_at?.split('T')[0] || '',
              poQty: order.po_qty,
              balanceQty: order.balance_qty,
              price: order.price,
              fgStock: order.fg_stock,
              wipStock: order.wip_stock,
              partDescription: order.part?.part_description || 'Unknown Part',
              drawingNo: order.part?.drawing_no || '',
              reqdDate: order.reqd_date_as_per_po ? order.reqd_date_as_per_po.split('T')[0] : '',
              dispatchDate: order.dispatch_details_inv_date ? order.dispatch_details_inv_date.split('T')[0] : '',
              invNo: order.dispatch_details_inv_no || '',
              originalOrder: order
            }
          })
          
          console.log('Mapped Orders:', validOrders) // Debug log
          
          setOrders(validOrders)
          setFilteredOrders(validOrders)
          
          // Handle pagination from backend if available, otherwise calculate locally
          if (response.data && response.data.pagination) {
            setCurrentPage(response.data.pagination.current_page)
            setTotalPages(response.data.pagination.last_page)
            setTotalItems(response.data.pagination.total)
            setIsBackendPaginated(true)
          } else {
            // Calculate pagination locally
            const total = validOrders.length
            const lastPage = Math.ceil(total / itemsPerPage)
            setCurrentPage(1)
            setTotalPages(lastPage)
            setTotalItems(total)
            setIsBackendPaginated(false)
          }
          
          // Extract unique companies with null check
          const uniqueCompanies = Array.from(new Set(
            ordersData
              .filter((order: Order) => order.customer?.name)
              .map((order: Order) => order.customer.name)
          ))
          setCompanies(uniqueCompanies)
        } else {
          console.log('No orders found, setting empty arrays')
          setOrders([])
          setFilteredOrders([])
          setCompanies([])
          setCurrentPage(1)
          setTotalPages(1)
          setTotalItems(0)
          setIsBackendPaginated(false)
        }
      } else {
        console.log('Invalid response structure:', response)
        setOrders([])
        setFilteredOrders([])
        setCompanies([])
        setCurrentPage(1)
        setTotalPages(1)
        setTotalItems(0)
        setIsBackendPaginated(false)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      setFilteredOrders([])
      setCompanies([])
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)
      setIsBackendPaginated(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    let filtered = orders

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(order => order.company === companyFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(order => order.createdDate === dateFilter)
    }

    setFilteredOrders(filtered)
    
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [orders, searchTerm, companyFilter, statusFilter, dateFilter])

  // Get paginated data for current page
  const getPaginatedData = () => {
    if (isBackendPaginated) {
      // Backend pagination - return data as-is (already paginated)
      return filteredOrders
    } else {
      // Local pagination - slice the filtered data
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      return filteredOrders.slice(startIndex, endIndex)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      
      if (isBackendPaginated) {
        // Backend pagination - fetch new page data from API
        fetchOrdersWithPage(page)
      } else {
        // Local pagination - just update the page state
        // Data will be filtered and sliced by getPaginatedData()
      }
    }
  }

  // Fetch orders with page parameter for backend pagination
  const fetchOrdersWithPage = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await superadminApi.getOrders() as { success: boolean; data: any }
      console.log('Orders API Response (page fetch):', response)
      
      if (response.success) {
        let ordersData: Order[] = []
        
        if (Array.isArray(response.data)) {
          ordersData = response.data.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        } else if (response.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        
        if (ordersData.length > 0) {
          const validOrders: OrderDisplay[] = ordersData.map((order: Order) => ({
            id: order.id,
            orderNumber: order.po_no || `ORD-${order.id}`,
            company: order.customer?.name || 'Unknown Company',
            status: order.po_received ? 'Received' : 'Pending',
            createdDate: order.created_at ? order.created_at.split('T')[0] : '',
            quantity: order.po_qty || 0,
            balance: order.balance_qty || 0,
            price: order.price || 0,
            partDescription: order.part?.part_description || 'Unknown Part',
            drawingNo: order.part?.drawing_no || '',
            reqdDate: order.reqd_date_as_per_po ? order.reqd_date_as_per_po.split('T')[0] : '',
            dispatchDate: order.dispatch_details_inv_date ? order.dispatch_details_inv_date.split('T')[0] : '',
            invNo: order.dispatch_details_inv_no || '',
            originalOrder: order
          }))
          
          setOrders(validOrders)
          setFilteredOrders(validOrders)
          
          // Update pagination state
          if (response.data && response.data.pagination) {
            setCurrentPage(response.data.pagination.current_page)
            setTotalPages(response.data.pagination.last_page)
            setTotalItems(response.data.pagination.total)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching orders page:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setShowViewModal(true)
    }
  }

  const handleAddOrder = () => {
    console.log('Add Order button clicked') // Debug log
    // alert('Add Order button clicked!') // Simple test
    setShowAddModal(true)
    console.log('showAddModal set to true') // Debug log
  }

  const handleEditOrder = (order: OrderDisplay) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to delete order "${orderNumber}"? This action cannot be undone.`)) {
      try {
        const response = await superadminApi.deleteOrder(parseInt(orderId)) as { success: boolean }
        if (response.success) {
          // Show success message
          alert('Order deleted successfully')
          // Refresh orders list
          await fetchOrders()
        } else {
          alert('Failed to delete order: ' + ((response as any).message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error deleting order:', error)
        alert('Failed to delete order. Please try again.')
      }
    }
  }

  const handleCloseModal = () => {
    setShowViewModal(false)
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedOrder(null)
  }

  const handleAddSuccess = () => {
    fetchOrders()
    setShowAddModal(false)
  }

  const handleEditSuccess = () => {
    console.log('handleEditSuccess called') // Debug log
    console.log('Immediately calling fetchOrders') // Debug log
    fetchOrders()
    setShowEditModal(false)
    setSelectedOrder(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Global Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            View all orders across all companies in the system • Total: {orders.length}
          </p>
        </div>
        <button
          onClick={handleAddOrder}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors"
          style={{ zIndex: 50, position: 'relative' }}
          data-testid="add-order-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
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
              <option key="all" value="all">All customers</option>
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
              <option key="all" value="all">All Status</option>
              <option key="pending" value="pending">Pending</option>
              <option key="processing" value="processing">Processing</option>
              <option key="completed" value="completed">Completed</option>
              <option key="cancelled" value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drawing No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FG Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WIP Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispatch Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedData().map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.company}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {order.partDescription}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.drawingNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.poQty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.balanceQty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(order.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{order.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.fgStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.wipStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.reqdDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.dispatchDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.invNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'pending'
                        ? 'bg-blue-200 text-blue-900'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit Order"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-blue-900 hover:text-blue-800 p-1"
                        title="View Order"
                      >
                        <Eye className="h-4 w-4" />
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
                    {isBackendPaginated ? Math.min(currentPage * itemsPerPage, totalItems) : Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                  </span>{' '}
                  of <span className="font-medium">{isBackendPaginated ? totalItems : filteredOrders.length}</span> results
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

        {getPaginatedData().length === 0 && filteredOrders.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No orders found on this page.</p>
          </div>
        )}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No orders found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
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
                    Order Details
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
                      <label className="block text-sm font-medium text-gray-500">PO Number</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Customer</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.company}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Part Description</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedOrder.partDescription}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Drawing No</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.drawingNo}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">PO Quantity</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.poQty}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Balance Quantity</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.balanceQty}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Unit Price</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">₹{parseFloat(selectedOrder.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Amount</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">₹{selectedOrder.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedOrder.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : selectedOrder.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedOrder.status === 'pending'
                            ? 'bg-blue-200 text-blue-900'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">FG Stock</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.fgStock}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">WIP Stock</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.wipStock}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedOrder.createdDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Required Date</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.reqdDate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Dispatch Date</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedOrder.dispatchDate}</p>
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{Math.floor(selectedOrder.total * 0.9).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (10%)</span>
                        <span>₹{Math.floor(selectedOrder.total * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total</span>
                        <span>₹{selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {console.log('Rendering AddOrderModal, showAddModal:', showAddModal)}
      {showAddModal && (
        <AddOrderModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <EditOrderModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOrder(null)
          }}
          onSuccess={handleEditSuccess}
          order={selectedOrder}
        />
      )}
    </div>
  )
}

export default Orders