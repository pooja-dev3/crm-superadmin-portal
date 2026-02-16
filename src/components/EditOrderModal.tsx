import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ordersApi, customerApi, partApi, companyApi } from '../services'
import type { Order, Customer, PartWithCustomer, OrderDisplay, Company } from '../types/api'

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  order: OrderDisplay
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ isOpen, onClose, onSuccess, order }) => {
  const [formData, setFormData] = useState<Partial<Order>>({})
  const [customers, setCustomers] = useState<Customer[]>([])
  const [parts, setParts] = useState<PartWithCustomer[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Order>>({})

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  useEffect(() => {
    if (order) {
      const initialData = {
        customer_id: order.originalOrder?.customer_id,
        part_id: order.originalOrder?.part_id,
        po_no: order.originalOrder?.po_no || '',
        po_date: order.originalOrder?.po_date ? order.originalOrder.po_date.split('T')[0] : '',
        po_received: order.originalOrder?.po_received || false,
        po_qty: order.originalOrder?.po_qty,
        po_drg_rev: order.originalOrder?.po_drg_rev || '',
        acknowledgement_remarks: order.originalOrder?.acknowledgement_remarks || '',
        reqd_date_as_per_po: order.originalOrder?.reqd_date_as_per_po ? order.originalOrder.reqd_date_as_per_po.split('T')[0] : '',
        price: order.originalOrder?.price || '',
        balance_qty: order.originalOrder?.balance_qty,
        comp_name: order.originalOrder?.comp_name || ''
      }
      console.log('Setting initial form data:', initialData) // Debug log
      setFormData(initialData)
    }
  }, [order, isOpen])

  useEffect(() => {
    console.log('Form data changed:', formData) // Debug log
  }, [formData])

  const fetchData = async () => {
    try {
      const [customersResponse, partsResponse, companiesResponse] = await Promise.all([
        customerApi.getAllCustomers(),
        partApi.getAllParts(),
        companyApi.getAllCompanies()
      ])

      // Handle customers response
      if (customersResponse.success) {
        if (Array.isArray(customersResponse.data)) {
          setCustomers(customersResponse.data)
        } else if (customersResponse.data && Array.isArray(customersResponse.data.data)) {
          setCustomers(customersResponse.data.data)
        }
      }

      // Handle parts response - parts API returns ApiResponse<PartWithCustomer[]>
      if (partsResponse.success && Array.isArray(partsResponse.data)) {
        setParts(partsResponse.data)
      }

      // Handle companies response
      if (companiesResponse.success) {
        if (Array.isArray(companiesResponse.data)) {
          setCompanies(companiesResponse.data)
        } else if (companiesResponse.data && Array.isArray(companiesResponse.data.data)) {
          setCompanies(companiesResponse.data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    console.log('=== INPUT CHANGE DETECTED ===') // Debug log
    const { name, value, type } = e.target
    
    console.log('Input changed:', { name, value, type }) // Debug log
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      console.log('Checkbox changed:', { name, checked }) // Debug log
      setFormData(prev => {
        console.log('Previous form data:', prev) // Debug log
        const newData = { ...prev, [name]: checked }
        console.log('New form data:', newData) // Debug log
        return newData
      })
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : Number(value)
      console.log('Number changed:', { name, numValue }) // Debug log
      setFormData(prev => {
        console.log('Previous form data:', prev) // Debug log
        const newData = { ...prev, [name]: numValue }
        console.log('New form data:', newData) // Debug log
        return newData
      })
    } else {
      console.log('Text changed:', { name, value }) // Debug log
      setFormData(prev => {
        console.log('Previous form data:', prev) // Debug log
        const newData = { ...prev, [name]: value }
        console.log('New form data:', newData) // Debug log
        return newData
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }
    if (!formData.part_id) {
      newErrors.part_id = 'Part is required'
    }
    if (!formData.po_no?.trim()) {
      newErrors.po_no = 'PO number is required'
    }
    if (!formData.po_qty || formData.po_qty <= 0) {
      newErrors.po_qty = 'PO quantity must be greater than 0'
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    if (!formData.comp_name?.trim()) {
      newErrors.comp_name = 'Company name is required'
    }

    setErrors(newErrors as Partial<Order>)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Force a small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 0))
    
    setIsSubmitting(true)
    try {
      // Get the current form data to ensure we have the latest state
      const currentFormData = { ...formData }
      console.log('Submitting edit with current data:', currentFormData) // Debug log
      const response = await ordersApi.updateOrder(order.id, currentFormData as Partial<Order>)
      console.log('Edit response:', response) // Debug log
      if (response.success) {
        console.log('Edit successful, calling onSuccess') // Debug log
        alert('Order updated successfully')
        onSuccess()
        onClose()
      } else {
        alert('Failed to update order: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Edit Order - {order.orderNumber}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 transition-colors"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                    Customer *
                  </label>
                  <select
                    id="customer_id"
                    name="customer_id"
                    value={formData.customer_id || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="part_id" className="block text-sm font-medium text-gray-700">
                    Part *
                  </label>
                  <select
                    id="part_id"
                    name="part_id"
                    value={formData.part_id || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  >
                    <option value="">Select a part</option>
                    {parts.map(part => (
                      <option key={part.id} value={part.id}>
                        {part.part_description}
                      </option>
                    ))}
                  </select>
                  {errors.part_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.part_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="po_no" className="block text-sm font-medium text-gray-700">
                    PO Number *
                  </label>
                  <input
                    type="text"
                    id="po_no"
                    name="po_no"
                    value={formData.po_no}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="Enter PO number"
                  />
                  {errors.po_no && (
                    <p className="mt-1 text-sm text-red-600">{errors.po_no}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="po_date" className="block text-sm font-medium text-gray-700">
                    PO Date
                  </label>
                  <input
                    type="date"
                    id="po_date"
                    name="po_date"
                    value={formData.po_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="po_qty" className="block text-sm font-medium text-gray-700">
                    PO Quantity *
                  </label>
                  <input
                    type="number"
                    id="po_qty"
                    name="po_qty"
                    value={formData.po_qty || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="Enter PO quantity"
                    min="1"
                  />
                  {errors.po_qty && (
                    <p className="mt-1 text-sm text-red-600">{errors.po_qty}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="Enter unit price"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="comp_name" className="block text-sm font-medium text-gray-700">
                    Company *
                  </label>
                  <select
                    id="comp_name"
                    name="comp_name"
                    value={formData.comp_name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.comp_name}>
                        {company.comp_name}
                      </option>
                    ))}
                  </select>
                  {errors.comp_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.comp_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="balance_qty" className="block text-sm font-medium text-gray-700">
                    Balance Quantity
                  </label>
                  <input
                    type="number"
                    id="balance_qty"
                    name="balance_qty"
                    value={formData.balance_qty || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="Enter balance quantity"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="po_drg_rev" className="block text-sm font-medium text-gray-700">
                    PO Drawing Revision
                  </label>
                  <input
                    type="text"
                    id="po_drg_rev"
                    name="po_drg_rev"
                    value={formData.po_drg_rev}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="Enter PO drawing revision"
                  />
                </div>

                <div>
                  <label htmlFor="reqd_date_as_per_po" className="block text-sm font-medium text-gray-700">
                    Required Date
                  </label>
                  <input
                    type="date"
                    id="reqd_date_as_per_po"
                    name="reqd_date_as_per_po"
                    value={formData.reqd_date_as_per_po}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="acknowledgement_remarks" className="block text-sm font-medium text-gray-700">
                  Acknowledgement Remarks
                </label>
                <textarea
                  id="acknowledgement_remarks"
                  name="acknowledgement_remarks"
                  value={formData.acknowledgement_remarks}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  placeholder="Enter acknowledgement remarks"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="po_received"
                  name="po_received"
                  checked={formData.po_received}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300 rounded"
                />
                <label htmlFor="po_received" className="ml-2 block text-sm text-gray-700">
                  PO Received
                </label>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditOrderModal
