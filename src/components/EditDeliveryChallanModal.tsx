import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import { customerApi, partApi } from '../services'
import type { DeliveryChallan, UpdateDeliveryChallanRequest } from '../services/deliveryChallans'

interface EditDeliveryChallanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  challan: DeliveryChallan | null
}

const EditDeliveryChallanModal: React.FC<EditDeliveryChallanModalProps> = ({ isOpen, onClose, onSuccess, challan }) => {
  // Helper function to format date for input field
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    // Handle various date formats and return yyyy-MM-dd
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<UpdateDeliveryChallanRequest>({
    challan_no: '',
    comp_name: '',
    customer_id: null,
    challan_date: '',
    to: '',
    from: '',
    part_id: null,
    part_no: '',
    part_description: '',
    hsn_code: '',
    quantity: 1,
    unit_rate: '0.00',
    total: '0.00',
    notes: null,
    signature: null,
    status: 'pending'
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<UpdateDeliveryChallanRequest>>({})

  useEffect(() => {
    if (challan && isOpen) {
      console.log('Prefilling form with challan data:', challan)
      
      setFormData({
        challan_no: challan.challan_no || challan.challanNumber || '',
        comp_name: (challan.comp_name || challan.company) || (challan.company || ''),
        customer_id: challan.customer_id || challan.customer?.id || null,
        challan_date: challan.challan_date || challan.createdDate || '',
        to: challan.to || (challan.comp_name || challan.company || ''),
        from: challan.from || '',
        part_id: challan.part_id || challan.part?.id || null,
        part_no: challan.part_no || challan.orderId || '',
        part_description: challan.partDescription || '',
        hsn_code: challan.hsn_code || challan.hsnCode || '',
        quantity: challan.quantity || 1,
        unit_rate: challan.unit_rate || challan.unitRate || '0.00',
        total: challan.total || '0.00',
        notes: challan.notes || null,
        signature: challan.signature || null,
        status: challan.status || 'pending'
      })
      setErrors({})
      fetchCompanies()
      fetchParts()
      fetchCustomers()
    }
  }, [challan, isOpen])

  const fetchCompanies = async () => {
    try {
      const response = await customerApi.getAllCustomers()
      if (response.success) {
        let companiesData: any[] = []
        
        if (Array.isArray(response.data)) {
          companiesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          companiesData = response.data.data
        }
        
        setCompanies(companiesData)
        console.log('Companies loaded for dropdown:', companiesData.length, companiesData)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchParts = async () => {
    try {
      const response = await partApi.getAllParts()
      if (response.success) {
        let partsData: any[] = []
        
        if (Array.isArray(response.data)) {
          partsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          partsData = response.data.data
        }
        
        setParts(partsData)
        console.log('Parts loaded for dropdown:', partsData.length, partsData)
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getAllCustomers()
      if (response.success) {
        let customersData: any[] = []
        
        if (Array.isArray(response.data)) {
          customersData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customersData = response.data.data
        }
        
        setCustomers(customersData)
        console.log('Customers loaded for dropdown:', customersData.length, customersData)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof UpdateDeliveryChallanRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // All fields are mandatory
    if (!formData.challan_no?.trim()) {
      newErrors.challan_no = 'Challan number is required'
    }
    if (!formData.comp_name?.trim()) {
      newErrors.comp_name = 'Company is required'
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }
    if (!formData.challan_date?.trim()) {
      newErrors.challan_date = 'Delivery date is required'
    }
    if (!formData.to?.trim()) {
      newErrors.to = 'To field is required'
    }
    if (!formData.from?.trim()) {
      newErrors.from = 'From field is required'
    }
    if (!formData.part_id) {
      newErrors.part_id = 'Part is required'
    }
    if (!formData.part_no?.trim()) {
      newErrors.part_no = 'Part number is required'
    }
    if (!formData.part_description?.trim()) {
      newErrors.part_description = 'Part description is required'
    }
    if (!formData.hsn_code?.trim()) {
      newErrors.hsn_code = 'HSN code is required'
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    if (!formData.unit_rate?.trim()) {
      newErrors.unit_rate = 'Unit rate is required'
    }
    if (!formData.total?.trim()) {
      newErrors.total = 'Total is required'
    }
    if (!formData.challan_date?.trim()) {
      newErrors.challan_date = 'Challan date is required'
    }
    if (!formData.signature?.trim()) {
      newErrors.signature = 'Signature is required'
    }
    if (!formData.notes?.trim()) {
      newErrors.notes = 'Notes are required'
    }
    if (!formData.status) {
      newErrors.status = 'Status is required'
    }

    setErrors(newErrors as Partial<UpdateDeliveryChallanRequest>)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form data being submitted:', formData)
    console.log('Challan ID:', challan?.id, 'Type:', typeof challan?.id)
    
    if (!validateForm() || !challan) return
    
    // Ensure part_id and customer_id are valid before sending (same as Add modal)
    const submitData = {
      ...formData,
      part_id: formData.part_id && formData.part_id > 0 ? formData.part_id : null,
      customer_id: formData.customer_id && formData.customer_id > 0 ? formData.customer_id : null
    }
    
    console.log('Processed submit data:', submitData)
    
    setIsSubmitting(true)
    try {
      const challanId = parseInt(challan?.id || '0')
      console.log('Parsed challan ID:', challanId)
      
      const response = await superadminApi.updateDeliveryChallan(challanId, submitData)
      console.log('Raw API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Response success:', response?.success)
      console.log('Response data:', response?.data)
      console.log('Response message:', response?.message)
      
      // Handle different response formats
      const isSuccess = response?.success || response?.data?.success
      const message = response?.message || response?.data?.message || 'Update completed'
      
      console.log('Is success:', isSuccess)
      console.log('Final message:', message)
      
      if (isSuccess) {
        console.log('Update successful, calling onSuccess and closing modal')
        onSuccess()
        handleClose()
      } else {
        console.error('API Error Response:', response)
        alert(`Failed to update delivery challan: ${message}`)
      }
    } catch (error) {
      console.error('Error updating delivery challan:', error)
      alert('Failed to update delivery challan: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      challan_no: '',
      comp_name: '',
      customer_id: null,
      challan_date: '',
      to: '',
      from: '',
      part_id: null,
      part_no: '',
      part_description: '',
      hsn_code: '',
      quantity: 1,
      unit_rate: '0.00',
      total: '0.00',
      notes: null,
      signature: null
    })
    setErrors({})
    onClose()
  }

  if (!isOpen || !challan) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Delivery Challan
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="challan_no" className="block text-sm font-medium text-gray-700">
                      Challan Number *
                    </label>
                    <input
                      type="text"
                      id="challan_no"
                      name="challan_no"
                      value={formData.challan_no}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.challan_no ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter challan number"
                      disabled={isSubmitting}
                    />
                    {errors.challan_no && (
                      <p className="mt-1 text-sm text-red-600">{errors.challan_no}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                      Company/Recipient *
                    </label>
                    <select
                      id="to"
                      name="to"
                      value={formData.to}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.to ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.company_name || company.comp_name || company.name}>
                          {company.company_name || company.comp_name || company.name}
                        </option>
                      ))}
                    </select>
                    {errors.to && (
                      <p className="mt-1 text-sm text-red-600">{errors.to}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="part_id" className="block text-sm font-medium text-gray-700">
                    Part *
                  </label>
                  <select
                    id="part_id"
                    name="part_id"
                    value={formData.part_id || ''}
                    onChange={(e) => {
                      const selectedPartId = e.target.value ? Number(e.target.value) : null
                      const selectedPart = parts.find(part => part.id === selectedPartId)
                      setFormData(prev => ({
                        ...prev,
                        part_id: selectedPartId,
                        part_no: selectedPart?.part_no || '',
                        part_description: selectedPart?.part_description || '',
                        hsn_code: selectedPart?.hsn_code || ''
                      }))
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.part_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select part</option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.part_no} - {part.part_description}
                      </option>
                    ))}
                  </select>
                  {errors.part_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.part_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="part_no" className="block text-sm font-medium text-gray-700">
                    Part Number *
                  </label>
                  <input
                    type="text"
                    id="part_no"
                    name="part_no"
                    value={formData.part_no}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.part_no ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter part number"
                    disabled={isSubmitting}
                  />
                  {errors.part_no && (
                    <p className="mt-1 text-sm text-red-600">{errors.part_no}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                      From *
                    </label>
                    <input
                      type="text"
                      id="from"
                      name="from"
                      value={formData.from}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.from ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter from location"
                      disabled={isSubmitting}
                    />
                    {errors.from && (
                      <p className="mt-1 text-sm text-red-600">{errors.from}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="part_description" className="block text-sm font-medium text-gray-700">
                      Part Description *
                    </label>
                    <input
                      type="text"
                      id="part_description"
                      name="part_description"
                      value={formData.part_description}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.part_description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter part description"
                      disabled={isSubmitting}
                    />
                    {errors.part_description && (
                      <p className="mt-1 text-sm text-red-600">{errors.part_description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                      Customer *
                    </label>
                    <select
                      id="customer_id"
                      name="customer_id"
                      value={formData.customer_id?.toString() || ''}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.customer_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select customer</option>
                      {customers.map((customer) => (
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
                    <label htmlFor="hsn_code" className="block text-sm font-medium text-gray-700">
                      HSN Code *
                    </label>
                    <input
                      type="text"
                      id="hsn_code"
                      name="hsn_code"
                      value={formData.hsn_code}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter HSN code"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.quantity ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter quantity"
                      min="1"
                      disabled={isSubmitting}
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="unit_rate" className="block text-sm font-medium text-gray-700">
                      Unit Rate *
                    </label>
                    <input
                      type="text"
                      id="unit_rate"
                      name="unit_rate"
                      value={formData.unit_rate}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.unit_rate ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter unit rate"
                      disabled={isSubmitting}
                    />
                    {errors.unit_rate && (
                      <p className="mt-1 text-sm text-red-600">{errors.unit_rate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="total" className="block text-sm font-medium text-gray-700">
                    Total Amount *
                  </label>
                  <input
                    type="text"
                    id="total"
                    name="total"
                    value={formData.total}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.total ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter total amount"
                    disabled={isSubmitting}
                  />
                  {errors.total && (
                    <p className="mt-1 text-sm text-red-600">{errors.total}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.status ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="challan_date" className="block text-sm font-medium text-gray-700">
                      Challan Date
                    </label>
                    <input
                      type="date"
                      id="challan_date"
                      name="challan_date"
                      value={formatDateForInput(formData.challan_date)}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Challan'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditDeliveryChallanModal
