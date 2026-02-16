import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Package, FileText, DollarSign } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { CreateDeliveryChallanRequest } from '../services/deliveryChallans'
import { companyApi } from '../services'

interface DeliveryChallanErrors {
  challan_no?: string
  challan_date?: string
  to?: string
  from?: string
  part_id?: string
  part_no?: string
  part_description?: string
  hsn_code?: string
  quantity?: string
  unit_rate?: string
  total?: string
  notes?: string
  signature?: string
  comp_name?: string
}

interface AddDeliveryChallanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddDeliveryChallanModal: React.FC<AddDeliveryChallanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateDeliveryChallanRequest>({
    challan_no: '',
    challan_date: '',
    to: '',
    from: '',
    part_id: null, // Changed from 0 to null
    part_no: '',
    part_description: '',
    hsn_code: '',
    quantity: 1,
    unit_rate: '0.00',
    total: '0.00',
    notes: null, // Changed to null to match API
    signature: null, // Changed to null to match API
    comp_name: '',
    customer_id: null, // Added missing field
    driver_name: '', // Added missing field
    driver_contact_number: '' // Added missing field
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<DeliveryChallanErrors>({})

  useEffect(() => {
    if (isOpen) {
      // Generate auto challan number
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const autoChallanNumber = `DC-${year}${month}${day}-${random}`
      
      setFormData(prev => ({ 
        ...prev, 
        challan_no: autoChallanNumber,
        challan_date: today.toISOString().split('T')[0], // Should be current date like 2026-02-16
        from: 'Eskay Engichem Pvt Ltd' // Set default from value
      }))
      setErrors({})
      
      // Fetch companies and parts for dropdowns
      fetchCompanies()
      fetchParts()
    }
  }, [isOpen])

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAllCompanies()
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
      const response = await superadminApi.getParts() as { success: boolean; data: any }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let processedValue: string | number = value
    
    // Convert to number for quantity field
    if (name === 'quantity' && type === 'number') {
      processedValue = value === '' ? 0 : Number(value)
    }
    
    // If company is selected, also set comp_name
    if (name === 'to') {
      const selectedCompany = companies.find(company => 
        company.company_name === value || company.comp_name === value || company.name === value
      )
      setFormData(prev => ({
        ...prev,
        [name]: processedValue as string, // Ensure 'to' is always string
        comp_name: selectedCompany?.company_name || selectedCompany?.comp_name || selectedCompany?.name || value
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }))
    }
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof DeliveryChallanErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: DeliveryChallanErrors = {}
    
    if (!formData.challan_no.trim()) {
      newErrors.challan_no = 'Challan number is required'
    }
    if (!formData.to.trim()) {
      newErrors.to = 'Company/Recipient is required'
    }
    if (!formData.comp_name.trim()) {
      newErrors.comp_name = 'Company name is required'
    }
    if (!formData.from.trim()) {
      newErrors.from = 'From location is required'
    }
    if (!formData.part_id) {
      newErrors.part_id = 'Part selection is required'
    }
    if (!formData.quantity || typeof formData.quantity !== 'number' || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    if (!formData.unit_rate.trim()) {
      newErrors.unit_rate = 'Unit rate is required'
    }
    if (!formData.total.trim()) {
      newErrors.total = 'Total is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    // Ensure part_id is valid before sending
    const submitData = {
      ...formData,
      part_id: formData.part_id && formData.part_id > 0 ? formData.part_id : null
    }
    
    setIsSubmitting(true)
    try {
      console.log('Submitting delivery challan data:', submitData)
      const response = await superadminApi.createDeliveryChallan(submitData)
      console.log('Create delivery challan response:', response)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating delivery challan:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      challan_no: '',
      challan_date: '',
      to: '',
      from: '',
      part_id: 0,
      part_no: '',
      part_description: '',
      hsn_code: '',
      quantity: 0,
      unit_rate: '0.00',
      total: '0.00',
      notes: '',
      signature: '',
      comp_name: ''
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Delivery Challan
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="hsn_code" className="block text-sm font-medium text-gray-700">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      id="hsn_code"
                      name="hsn_code"
                      value={formData.hsn_code}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter HSN code"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                    onChange={handleChange}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="challan_date" className="block text-sm font-medium text-gray-700">
                      Challan Date
                    </label>
                    <input
                      type="date"
                      id="challan_date"
                      name="challan_date"
                      value={formData.challan_date}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="signature" className="block text-sm font-medium text-gray-700">
                      Authorized Signature
                    </label>
                    <input
                      type="text"
                      id="signature"
                      name="signature"
                      value={formData.signature}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter authorized signature"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="Enter any additional notes"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Delivery Instructions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure all items are properly packed</li>
                    <li>• Verify order quantities before dispatch</li>
                    <li>• Get signature from recipient upon delivery</li>
                    <li>• Update status to "delivered" after completion</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Challan'}
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

export default AddDeliveryChallanModal
