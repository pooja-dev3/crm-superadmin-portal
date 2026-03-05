import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { customerApi } from '../services/customers'
import { partApi } from '../services/parts'
import { companyApi, type Company } from '../services/companies'
import type { CreatePartRequest, Customer } from '../types/api'

interface AddPartModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddPartModal: React.FC<AddPartModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreatePartRequest>({
    customer_id: 0,
    part_description: '',
    drawing_no: '',
    rev_no: '',
    net_wt: 0,
    thickness: 0,
    tool_information: '',
    raw_material: '',
    drawing_location: '',
    operation_sequence: '',
    lead_time: 0,
    po_no: '',
    po_date: '',
    po_received: false,
    po_qty: 0,
    po_drg_rev: '',
    acknowledgement_remarks: '',
    reqd_date_as_per_po: '',
    comp_name: ''
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [errors, setErrors] = useState<Partial<CreatePartRequest>>({})

  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
    }
  }, [isOpen])

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAllCompanies()
      if (response.success && Array.isArray(response.data)) {
        setCompanies(response.data)
      } else {
        setCompanies([])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchCustomersForCompany = async (companyName: string) => {
    setIsLoadingCustomers(true)
    try {
      const response = await customerApi.getAllCustomers()

      if (response.success) {
        let customersData: Customer[] = []

        if (Array.isArray(response.data)) {
          customersData = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          customersData = response.data.data
        }

        // Try multiple possible company field names to filter customers
        const companyCustomers = customersData.filter(customer => {
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

        console.log('Customers loaded for company:', companyName, companyCustomers)
        setCustomers(companyCustomers)

        // Reset customer selection when company changes
        setFormData(prev => ({ ...prev, customer_id: 0 }))
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      const numValue = value === '' ? 0 : Number(value)
      setFormData(prev => ({ ...prev, [name]: numValue }))
    } else if (name === 'customer_id') {
      const customerId = value === '' ? 0 : Number(value)
      setFormData(prev => ({ ...prev, [name]: customerId }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Clear error when user starts typing
    if (errors[name as keyof CreatePartRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyName = e.target.value
    setFormData(prev => ({ ...prev, comp_name: companyName, customer_id: 0 }))
    fetchCustomersForCompany(companyName)
    // Clear error when user selects a company
    if (errors.comp_name) {
      setErrors(prev => ({ ...prev, comp_name: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }
    if (!formData.comp_name.trim()) {
      newErrors.comp_name = 'Company selection is required'
    }
    if (!formData.part_description.trim()) {
      newErrors.part_description = 'Part description is required'
    }
    if (!formData.drawing_no.trim()) {
      newErrors.drawing_no = 'Drawing number is required'
    }
    if (!formData.rev_no.trim()) {
      newErrors.rev_no = 'Revision number is required'
    }
    if (!formData.net_wt || formData.net_wt <= 0) {
      newErrors.net_wt = 'Net weight is required and must be greater than 0'
    }
    if (!formData.thickness || formData.thickness <= 0) {
      newErrors.thickness = 'Thickness is required and must be greater than 0'
    }
    if (!formData.raw_material.trim()) {
      newErrors.raw_material = 'Raw material is required'
    }
    if (!formData.lead_time || formData.lead_time <= 0) {
      newErrors.lead_time = 'Lead time is required and must be greater than 0'
    }
    if (!formData.tool_information.trim()) {
      newErrors.tool_information = 'Tool information is required'
    }
    if (!formData.drawing_location.trim()) {
      newErrors.drawing_location = 'Drawing location is required'
    }
    if (!formData.operation_sequence.trim()) {
      newErrors.operation_sequence = 'Operation sequence is required'
    }
    if (!formData.po_no.trim()) {
      newErrors.po_no = 'PO number is required'
    }
    if (!formData.po_date) {
      newErrors.po_date = 'PO date is required'
    }
    if (!formData.po_qty || formData.po_qty <= 0) {
      newErrors.po_qty = 'PO quantity is required and must be greater than 0'
    }
    if (!formData.po_drg_rev.trim()) {
      newErrors.po_drg_rev = 'PO drawing revision is required'
    }
    if (!formData.reqd_date_as_per_po) {
      newErrors.reqd_date_as_per_po = 'Required date is required'
    }
    if (!formData.acknowledgement_remarks.trim()) {
      newErrors.acknowledgement_remarks = 'Acknowledgement remarks are required'
    }

    setErrors(newErrors as Partial<CreatePartRequest>)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await partApi.createPart(formData)
      if (response.success) {
        onSuccess()
        handleClose()
      }
    } catch (error) {
      console.error('Error creating part:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      customer_id: 0,
      part_description: '',
      drawing_no: '',
      rev_no: '',
      net_wt: 0,
      thickness: 0,
      tool_information: '',
      raw_material: '',
      drawing_location: '',
      operation_sequence: '',
      lead_time: 0,
      po_no: '',
      po_date: '',
      po_received: false,
      po_qty: 0,
      po_drg_rev: '',
      acknowledgement_remarks: '',
      reqd_date_as_per_po: '',
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Add New Part
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Section 1: Company & Customer Information */}
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">
                    Company & Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="company"
                        name="company"
                        value={formData.comp_name}
                        onChange={handleCompanyChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.comp_name ? 'border-red-300' : 'border-gray-300'
                          }`}
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
                      <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                        Customer <span className="text-red-500">*</span> {!formData.comp_name && <span className="text-gray-400">(Select company first)</span>}
                      </label>
                      <select
                        id="customer_id"
                        name="customer_id"
                        value={formData.customer_id || ''}
                        onChange={handleInputChange}
                        disabled={isLoadingCustomers || !formData.comp_name}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.customer_id ? 'border-red-300' : 'border-gray-300'
                          }`}
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
                  </div>
                </div>

                {/* Section 2: Part Details */}
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">
                    Part Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="part_description" className="block text-sm font-medium text-gray-700">
                        Part Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="part_description"
                        name="part_description"
                        value={formData.part_description}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.part_description ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter part description"
                      />
                      {errors.part_description && (
                        <p className="mt-1 text-sm text-red-600">{errors.part_description}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="drawing_no" className="block text-sm font-medium text-gray-700">
                        Drawing Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="drawing_no"
                        name="drawing_no"
                        value={formData.drawing_no}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.drawing_no ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter drawing number"
                      />
                      {errors.drawing_no && (
                        <p className="mt-1 text-sm text-red-600">{errors.drawing_no}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="rev_no" className="block text-sm font-medium text-gray-700">
                        Revision Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="rev_no"
                        name="rev_no"
                        value={formData.rev_no}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.rev_no ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter revision number"
                      />
                      {errors.rev_no && (
                        <p className="mt-1 text-sm text-red-600">{errors.rev_no}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="net_wt" className="block text-sm font-medium text-gray-700">
                        Net Weight <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="net_wt"
                        name="net_wt"
                        value={formData.net_wt || ''}
                        onChange={handleInputChange}
                        step="0.01"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.net_wt ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter net weight"
                      />
                      {errors.net_wt && (
                        <p className="mt-1 text-sm text-red-600">{errors.net_wt}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="thickness" className="block text-sm font-medium text-gray-700">
                        Thickness <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="thickness"
                        name="thickness"
                        value={formData.thickness || ''}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.thickness ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter thickness"
                        step="0.01"
                      />
                      {errors.thickness && (
                        <p className="mt-1 text-sm text-red-600">{errors.thickness}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="raw_material" className="block text-sm font-medium text-gray-700">
                        Raw Material <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="raw_material"
                        name="raw_material"
                        value={formData.raw_material}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.raw_material ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter raw material"
                      />
                      {errors.raw_material && (
                        <p className="mt-1 text-sm text-red-600">{errors.raw_material}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lead_time" className="block text-sm font-medium text-gray-700">
                        Lead Time (days) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="lead_time"
                        name="lead_time"
                        value={formData.lead_time || ''}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.lead_time ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter lead time in days"
                      />
                      {errors.lead_time && (
                        <p className="mt-1 text-sm text-red-600">{errors.lead_time}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Manufacturing Details */}
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">
                    Manufacturing Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="tool_information" className="block text-sm font-medium text-gray-700">
                        Tool Information <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="tool_information"
                        name="tool_information"
                        value={formData.tool_information}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.tool_information ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter tool information"
                      />
                      {errors.tool_information && (
                        <p className="mt-1 text-sm text-red-600">{errors.tool_information}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="drawing_location" className="block text-sm font-medium text-gray-700">
                        Drawing Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="drawing_location"
                        name="drawing_location"
                        value={formData.drawing_location}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.drawing_location ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter drawing location"
                      />
                      {errors.drawing_location && (
                        <p className="mt-1 text-sm text-red-600">{errors.drawing_location}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="operation_sequence" className="block text-sm font-medium text-gray-700">
                        Operation Sequence <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="operation_sequence"
                        name="operation_sequence"
                        value={formData.operation_sequence}
                        onChange={handleInputChange}
                        rows={2}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.operation_sequence ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter operation sequence"
                      />
                      {errors.operation_sequence && (
                        <p className="mt-1 text-sm text-red-600">{errors.operation_sequence}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: PO Details */}
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">
                    PO Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="po_no" className="block text-sm font-medium text-gray-700">
                        PO Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="po_no"
                        name="po_no"
                        value={formData.po_no}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.po_no ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter PO number"
                      />
                      {errors.po_no && (
                        <p className="mt-1 text-sm text-red-600">{errors.po_no}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="po_date" className="block text-sm font-medium text-gray-700">
                        PO Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="po_date"
                        name="po_date"
                        value={formData.po_date}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.po_date ? 'border-red-300' : 'border-gray-300'
                          }`}
                      />
                      {errors.po_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.po_date}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="po_qty" className="block text-sm font-medium text-gray-700">
                        PO Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="po_qty"
                        name="po_qty"
                        value={formData.po_qty || ''}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.po_qty ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter PO quantity"
                      />
                      {errors.po_qty && (
                        <p className="mt-1 text-sm text-red-600">{errors.po_qty}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="po_drg_rev" className="block text-sm font-medium text-gray-700">
                        PO Drawing Revision <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="po_drg_rev"
                        name="po_drg_rev"
                        value={formData.po_drg_rev}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.po_drg_rev ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter PO drawing revision"
                      />
                      {errors.po_drg_rev && (
                        <p className="mt-1 text-sm text-red-600">{errors.po_drg_rev}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reqd_date_as_per_po" className="block text-sm font-medium text-gray-700">
                        Required Date as per PO <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="reqd_date_as_per_po"
                        name="reqd_date_as_per_po"
                        value={formData.reqd_date_as_per_po}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.reqd_date_as_per_po ? 'border-red-300' : 'border-gray-300'
                          }`}
                      />
                      {errors.reqd_date_as_per_po && (
                        <p className="mt-1 text-sm text-red-600">{errors.reqd_date_as_per_po}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="acknowledgement_remarks" className="block text-sm font-medium text-gray-700">
                        Acknowledgement Remarks <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="acknowledgement_remarks"
                        name="acknowledgement_remarks"
                        value={formData.acknowledgement_remarks}
                        onChange={handleInputChange}
                        rows={2}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${errors.acknowledgement_remarks ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter acknowledgement remarks"
                      />
                      {errors.acknowledgement_remarks && (
                        <p className="mt-1 text-sm text-red-600">{errors.acknowledgement_remarks}</p>
                      )}
                    </div>

                    <div className="flex items-center pt-2">
                      <input
                        type="checkbox"
                        id="po_received"
                        name="po_received"
                        checked={formData.po_received}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300 rounded"
                      />
                      <label htmlFor="po_received" className="ml-2 block text-sm text-gray-900">
                        PO Received
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || isLoadingCustomers}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Part'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
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

export default AddPartModal
