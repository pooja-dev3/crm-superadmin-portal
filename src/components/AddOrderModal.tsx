import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ordersApi, customerApi, partApi, companyApi } from '../services'
import type { CreateOrderRequest, Order, Customer, PartWithCustomer, Company } from '../types/api'

interface AddOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateOrderRequest>({
    customer_id: 0,
    part_id: 0,
    po_no: '',
    po_date: '',
    po_received: false,
    po_qty: 0,
    po_drg_rev: '',
    acknowledgement_remarks: '',
    reqd_date_as_per_po: '',
    dispatch_details_inv_date: '',
    dispatch_details_inv_no: '',
    dispatch_details_inv_qlt: 0,
    balance_qty: 0,
    balance_as_per_hitachi: 0,
    price: '',
    fg_stock: 0,
    wip_stock: 0,
    comp_name: ''
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [parts, setParts] = useState<PartWithCustomer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<CreateOrderRequest>>({})

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      // First fetch all companies
      const companiesResponse = await companyApi.getAllCompanies()
      
      if (companiesResponse.success) {
        let companiesData: Company[] = []
        
        if (Array.isArray(companiesResponse.data)) {
          companiesData = companiesResponse.data
        } else if (companiesResponse.data && Array.isArray(companiesResponse.data.data)) {
          companiesData = companiesResponse.data.data
        }
        
        setCompanies(companiesData)
        console.log('Companies loaded:', companiesData)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchCustomersForCompany = async (companyName: string) => {
    try {
      // Fetch customers (this should ideally be filtered by company, but using all customers for now)
      const customersResponse = await customerApi.getAllCustomers()
      
      if (customersResponse.success) {
        let customersData: Customer[] = []
        
        if (Array.isArray(customersResponse.data)) {
          customersData = customersResponse.data
        } else if (customersResponse.data && Array.isArray(customersResponse.data.data)) {
          customersData = customersResponse.data.data
        }
        
        // Debug: Log the raw customer response to understand the data structure
        console.log('Raw customers API response:', customersResponse)
        console.log('Customer response data structure:', customersResponse.data)
        
        // Try multiple possible company field names to filter customers
        const companyCustomers = customersData.filter(customer => {
          // Try multiple possible company field names due to inconsistent API
          const customerCompany = 
            (customer as any).company_name || 
            (customer as any).company || 
            (customer as any).comp_name || 
            (customer as any).companyId ||
            (customer as any).company_id ||
            customer.name === companyName // Fallback: check if customer name matches company name
          
          console.log(`Customer ${customer.id}: name=${customer.name}, company_field=${customerCompany}, selected_company=${companyName}`)
          
          return customerCompany === companyName || !customerCompany // Show if matches or no company field
        })
        
        console.log('All customers data:', customersData)
        console.log('Selected company:', companyName)
        console.log('Sample customer structure:', customersData[0])
        console.log('Customers to show:', companyCustomers)
        console.log('Filtered customers count:', companyCustomers.length, 'of', customersData.length)
        
        setCustomers(companyCustomers)
        console.log('Customers loaded for company:', companyName, companyCustomers)
        
        // Reset customer and part selections when company changes
        setFormData(prev => ({ ...prev, customer_id: 0, part_id: 0 }))
        setParts([])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
      setParts([])
    }
  }

  const fetchPartsForCustomer = async (customerId: number) => {
    try {
      console.log('=== DEBUG: fetchPartsForCustomer called ===')
      console.log('Customer ID:', customerId)
      
      // Fetch parts (this should ideally be filtered by customer, but using all parts for now)
      const partsResponse = await partApi.getAllParts()
      
      console.log('Parts API response:', partsResponse)
      console.log('Parts response success:', partsResponse.success)
      
      if (partsResponse.success) {
        let partsData: PartWithCustomer[] = []
        
        console.log('Raw parts response data:', partsResponse.data)
        console.log('Is partsResponse.data an array?', Array.isArray(partsResponse.data))
        console.log('Does partsResponse.data.data exist?', (partsResponse.data as any)?.data)
        console.log('Is partsResponse.data.data an array?', Array.isArray((partsResponse.data as any)?.data))
        
        if (Array.isArray(partsResponse.data)) {
          partsData = partsResponse.data
          console.log('Using partsResponse.data directly')
        } else if (partsResponse.data && Array.isArray((partsResponse.data as any).data)) {
          partsData = (partsResponse.data as any).data
          console.log('Using partsResponse.data.data')
        } else {
          console.log('No valid parts array found in response')
        }
        
        console.log('Final partsData:', partsData)
        console.log('PartsData length:', partsData.length)
        
        if (partsData.length > 0) {
          console.log('Sample part structure:', partsData[0])
          console.log('All part customer_ids:', partsData.map(p => ({ id: p.id, customer_id: p.customer_id })))
        }
        
        // Filter parts by selected customer - only show parts that belong to this customer
        const customerParts = partsData.filter(part => 
          part.customer_id === customerId
        )
        
        console.log('All parts data:', partsData)
        console.log('Selected customer ID:', customerId)
        console.log('Parts to show:', customerParts)
        console.log('Parts with customer_id:', partsData.filter(p => p.customer_id))
        console.log('Parts matching customer ID:', customerParts.length, 'of', partsData.length)
        
        setParts(customerParts)
        console.log('Parts state set to:', customerParts)
        console.log('Parts loaded for customer:', customerId, customerParts)
        
        // Reset part selection when customer changes
        setFormData(prev => ({ ...prev, part_id: 0 }))
      } else {
        console.log('Parts API call failed:', partsResponse.message)
        setParts([])
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
      setParts([])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : Number(value)
      setFormData(prev => ({ ...prev, [name]: numValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
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

    setIsSubmitting(true)
    try {
      const response = await ordersApi.createOrder(formData)
      if (response.success) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          customer_id: 0,
          part_id: 0,
          po_no: '',
          po_date: '',
          po_received: false,
          po_qty: 0,
          po_drg_rev: '',
          acknowledgement_remarks: '',
          reqd_date_as_per_po: '',
          dispatch_details_inv_date: '',
          dispatch_details_inv_no: '',
          dispatch_details_inv_qlt: 0,
          balance_qty: 0,
          balance_as_per_hitachi: 0,
          price: '',
          fg_stock: 0,
          wip_stock: 0,
          comp_name: ''
        })
      } else {
        console.error('Failed to create order:', response.message || 'Unknown error')
        // TODO: Show proper error notification instead of alert
      }
    } catch (error) {
      console.error('Error creating order:', error)
      // TODO: Show proper error notification instead of alert
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
                Add New Order
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
              {/* Step 1: Company Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company *
                  </label>
                  <select
                    id="company"
                    name="comp_name"
                    value={formData.comp_name}
                    onChange={(e) => {
                      const companyName = e.target.value
                      setFormData(prev => ({ ...prev, comp_name: companyName, customer_id: 0, part_id: 0 }))
                      fetchCustomersForCompany(companyName)
                    }}
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
                  {/* Empty div for grid layout */}
                </div>
              </div>

              {/* Step 2: Customer Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                    Customer * {!formData.comp_name && <span className="text-gray-400">(Select company first)</span>}
                  </label>
                  <select
                    id="customer_id"
                    name="customer_id"
                    value={formData.customer_id || ''}
                    onChange={(e) => {
                      const customerId = Number(e.target.value)
                      setFormData(prev => ({ ...prev, customer_id: customerId, part_id: 0 }))
                      fetchPartsForCustomer(customerId)
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    disabled={!formData.comp_name}
                  >
                    <option value="">{!formData.comp_name ? 'Select company first' : 'Select a customer'}</option>
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
                  {/* Empty div for grid layout */}
                </div>
              </div>

              {/* Step 3: Part Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="part_id" className="block text-sm font-medium text-gray-700">
                    Part * {!formData.customer_id && <span className="text-gray-400">(Select customer first)</span>}
                  </label>
                  <select
                    id="part_id"
                    name="part_id"
                    value={formData.part_id || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    disabled={!formData.customer_id}
                  >
                    <option value="">{!formData.customer_id ? 'Select customer first' : 'Select a part'}</option>
                    {parts.map(part => (
                      <option key={part.id} value={part.id}>
                        {part.drawing_no || (part as any).part_no || `Part-${part.id}`}: {part.part_description}
                      </option>
                    ))}
                  </select>
                  {errors.part_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.part_id}</p>
                  )}
                </div>

                <div>
                  {/* Empty div for grid layout */}
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
                    value={formData.po_date || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  />
                </div>

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
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddOrderModal
