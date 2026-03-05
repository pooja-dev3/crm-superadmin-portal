import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Package, FileText, DollarSign } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { CreateDeliveryChallanRequest } from '../services/deliveryChallans'
import { companyApi, customerApi } from '../services'

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
  inward?: string
  notes?: string
  signature?: string
  customer_id?: string
  comp_name?: string
  nature_of_processing?: string
}

interface AddDeliveryChallanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddDeliveryChallanModal: React.FC<AddDeliveryChallanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateDeliveryChallanRequest>({
    challan_no: '',
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
    inward: 0,
    notes: null,
    signature: null,
    comp_name: '',
    nature_of_processing: ''
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
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

      // Fetch companies, parts and customers for dropdowns
      fetchCompanies()
      fetchParts()
      fetchCustomers()
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
        console.log('Sample company structure:', companiesData[0]) // Debug first company structure
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchParts = async () => {
    try {
      const response = await superadminApi.getParts() as { success: boolean; data: any }
      console.log('Parts API response:', response)
      if (response.success) {
        let partsData: any[] = []

        if (Array.isArray(response.data)) {
          partsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          partsData = response.data.data
        }

        setParts(partsData)
        console.log('Parts loaded for dropdown:', partsData.length, partsData)
        console.log('Sample part structure:', partsData[0]) // Debug first part structure
        console.log('All parts customer_ids:', partsData.map(p => ({ id: p.id, customer_id: p.customer_id, name: p.part_description })))
      } else {
        console.log('Parts API failed:', response)
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
        console.log('Sample customer structure:', customersData[0]) // Debug first customer structure
        console.log('Available companies:', customersData.map(c => ({ id: c.id, name: c.name, comp_name: c.comp_name }))) // Debug company relationships
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  // Helper function to format date for input field
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return ''
    // Handle various date formats and return yyyy-MM-dd
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target

    // When company changes, clear customer and part selections
    setFormData(prev => ({
      ...prev,
      to: value,
      comp_name: value, // Sync comp_name with selected company
      customer_id: null,
      part_id: null,
      part_no: '',
      part_description: '',
      hsn_code: ''
    }))

    // Clear error for this field when user starts typing
    if (errors.to) {
      setErrors(prev => ({ ...prev, to: '' }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let processedValue: string | number | null = value

    // Convert to number for quantity, inward and customer_id fields
    if ((name === 'quantity' || name === 'inward') && type === 'number') {
      processedValue = value === '' ? 0 : Number(value)
    } else if (name === 'customer_id') {
      processedValue = value === '' ? null : Number(value)
      // When customer changes, clear part selection and reset part fields
      setFormData(prev => ({
        ...prev,
        customer_id: processedValue as number | null,
        part_id: null,
        part_no: '',
        part_description: '',
        hsn_code: ''
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    // Clear error for this field when user starts typing
    if (errors[name as keyof DeliveryChallanErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: DeliveryChallanErrors = {}

    if (!formData.challan_no?.trim()) {
      newErrors.challan_no = 'Challan number is required'
    }
    if (!formData.to?.trim()) {
      newErrors.to = 'Company is required'
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }
    if (!formData.challan_date?.trim()) {
      newErrors.challan_date = 'Challan date is required'
    }
    if (!formData.from?.trim()) {
      newErrors.from = 'From location is required'
    }
    if (!formData.part_id) {
      newErrors.part_id = 'Part selection is required'
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
    if (!formData.unit_rate || formData.unit_rate === '0.00' || formData.unit_rate.trim() === '') {
      newErrors.unit_rate = 'Unit rate is required'
    }
    if (!formData.total || formData.total === '0.00' || formData.total.trim() === '') {
      newErrors.total = 'Total is required'
    }
    if (!formData.comp_name?.trim()) {
      newErrors.comp_name = 'Company name is required'
    }
    if (!formData.nature_of_processing?.trim()) {
      newErrors.nature_of_processing = 'Nature of processing is required'
    }
    if (!formData.signature?.trim()) {
      newErrors.signature = 'Signature is required'
    }
    if (!formData.notes?.trim()) {
      newErrors.notes = 'Notes are required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Ensure part_id and customer_id are valid before sending
    const submitData = {
      ...formData,
      part_id: formData.part_id && formData.part_id > 0 ? formData.part_id : null,
      customer_id: formData.customer_id && formData.customer_id > 0 ? formData.customer_id : null
    }

    // Debug: Show selected part and customer details
    const selectedPart = parts.find(part => part.id === formData.part_id)
    console.log('Selected Part:', selectedPart)
    console.log('Selected Customer ID:', formData.customer_id)
    console.log('Part Customer ID:', selectedPart?.customer_id)
    console.log('Submit Data:', submitData)

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
      inward: 0,
      notes: null,
      signature: null,
      comp_name: '',
      nature_of_processing: ''
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
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="to"
                      name="to"
                      value={formData.to}
                      onChange={handleCompanyChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.to ? 'border-red-300' : 'border-gray-300'
                        }`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select company first</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.comp_name}>
                          {company.comp_name}
                        </option>
                      ))}
                    </select>
                    {errors.to && (
                      <p className="mt-1 text-sm text-red-600">{errors.to}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                      Customer <span className="text-red-500">*</span> {!formData.to && <span className="text-gray-400">(Select company first)</span>}
                    </label>
                    <select
                      id="customer_id"
                      name="customer_id"
                      value={formData.customer_id?.toString() || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.customer_id ? 'border-red-300' : 'border-gray-300'
                        }`}
                      disabled={isSubmitting || !formData.to}
                    >
                      <option value="">{!formData.to ? 'Select company first' : 'Select customer'}</option>
                      {customers
                        .filter(customer => {
                          const matchesCompany = !formData.to || customer.comp_name === formData.to
                          if (!matchesCompany && formData.to) {
                            console.log('Customer does not match company:', { customerName: customer.name, customerCompany: customer.comp_name, selectedCompany: formData.to })
                          }
                          return matchesCompany
                        })
                        .map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                    </select>
                    {errors.customer_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                    )}
                    {formData.to && customers.filter(customer => customer.comp_name === formData.to).length === 0 && (
                      <p className="mt-1 text-sm text-yellow-600">No customers found for this company</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="part_id" className="block text-sm font-medium text-gray-700">
                    Part <span className="text-red-500">*</span> {!formData.customer_id && <span className="text-gray-400">(Select customer first)</span>}
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
                        part_no: selectedPart?.drawing_no || '', // Use drawing_no as part_no
                        part_description: selectedPart?.part_description || '',
                        hsn_code: selectedPart?.hsn_code || ''
                      }))
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.part_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    disabled={isSubmitting || !formData.customer_id}
                  >
                    <option value="">{!formData.customer_id ? 'Select customer first' : 'Select part'}</option>
                    {parts
                      .filter(part => {
                        // If no customer selected, don't show any parts
                        if (!formData.customer_id) return false

                        // Try multiple possible customer_id field names
                        const customerIdMatch = part.customer_id === formData.customer_id ||
                          part.customerId === formData.customer_id ||
                          part.customer === formData.customer_id

                        console.log(`Part ${part.id}: customer_id=${part.customer_id}, customerId=${part.customerId}, customer=${part.customer}, selected=${formData.customer_id}, match=${customerIdMatch}`)

                        return customerIdMatch
                      })
                      .map((part) => (
                        <option key={part.id} value={part.id}>
                          {part.part_no || part.drawing_no} - {part.part_description}
                        </option>
                      ))}
                  </select>
                  {errors.part_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.part_id}</p>
                  )}
                  {formData.customer_id && parts.filter(part => part.customer_id === formData.customer_id).length === 0 && (
                    <p className="mt-1 text-sm text-yellow-600">No parts found for this customer</p>
                  )}
                </div>

                <div>
                  <label htmlFor="part_no" className="block text-sm font-medium text-gray-700">
                    Part Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="part_no"
                    name="part_no"
                    value={formData.part_no}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.part_no ? 'border-red-300' : 'border-gray-300'
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
                    <label htmlFor="challan_no" className="block text-sm font-medium text-gray-700">
                      Challan Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="challan_no"
                      name="challan_no"
                      value={formData.challan_no}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.challan_no ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter challan number"
                      disabled={isSubmitting}
                    />
                    {errors.challan_no && (
                      <p className="mt-1 text-sm text-red-600">{errors.challan_no}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                      From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="from"
                      name="from"
                      value={formData.from}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.from ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter from location"
                      disabled={isSubmitting}
                    />
                    {errors.from && (
                      <p className="mt-1 text-sm text-red-600">{errors.from}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="part_description" className="block text-sm font-medium text-gray-700">
                      Part Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="part_description"
                      name="part_description"
                      value={formData.part_description}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.part_description ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter part description"
                      disabled={isSubmitting}
                    />
                    {errors.part_description && (
                      <p className="mt-1 text-sm text-red-600">{errors.part_description}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="hsn_code" className="block text-sm font-medium text-gray-700">
                      HSN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="hsn_code"
                      name="hsn_code"
                      value={formData.hsn_code}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.hsn_code ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter HSN code"
                      disabled={isSubmitting}
                    />
                    {errors.hsn_code && (
                      <p className="mt-1 text-sm text-red-600">{errors.hsn_code}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.quantity ? 'border-red-300' : 'border-gray-300'
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
                      Unit Rate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="unit_rate"
                      name="unit_rate"
                      value={formData.unit_rate}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.unit_rate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter unit rate"
                      disabled={isSubmitting}
                    />
                    {errors.unit_rate && (
                      <p className="mt-1 text-sm text-red-600">{errors.unit_rate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inward" className="block text-sm font-medium text-gray-700">
                      Inward Quantity
                    </label>
                    <input
                      type="number"
                      id="inward"
                      name="inward"
                      value={formData.inward}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.inward ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter inward quantity"
                      min="0"
                      disabled={isSubmitting}
                    />
                    {errors.inward && (
                      <p className="mt-1 text-sm text-red-600">{errors.inward}</p>
                    )}
                  </div>


                  <div>
                    <label htmlFor="nature_of_processing" className="block text-sm font-medium text-gray-700">
                      Nature of Processing <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nature_of_processing"
                      name="nature_of_processing"
                      value={formData.nature_of_processing}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.nature_of_processing ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter nature of processing"
                      disabled={isSubmitting}
                    />
                    {errors.nature_of_processing && (
                      <p className="mt-1 text-sm text-red-600">{errors.nature_of_processing}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="total" className="block text-sm font-medium text-gray-700">
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="total"
                    name="total"
                    value={formData.total}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.total ? 'border-red-300' : 'border-gray-300'
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
                      Challan Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="challan_date"
                      name="challan_date"
                      value={formatDateForInput(formData.challan_date)}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.challan_date ? 'border-red-300' : 'border-gray-300'}`}
                      disabled={isSubmitting}
                    />
                    {errors.challan_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.challan_date}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signature" className="block text-sm font-medium text-gray-700">
                      Authorized Signature <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="signature"
                      name="signature"
                      value={formData.signature || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.signature ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter authorized signature"
                      disabled={isSubmitting}
                    />
                    {errors.signature && (
                      <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.notes ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Enter any additional notes"
                    disabled={isSubmitting}
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                  )}
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
