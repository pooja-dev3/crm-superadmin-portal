import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { partApi } from '../services/parts'
import { companyApi, type Company } from '../services/companies'
import type { PartWithCustomer, CreatePartRequest, CustomerWithParts } from '../types/api'

interface EditPartModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  part: PartWithCustomer | null
}

const EditPartModal: React.FC<EditPartModalProps> = ({ isOpen, onClose, onSuccess, part }) => {
  const [formData, setFormData] = useState<CreatePartRequest>({
    customer_id: 0,
    part_description: '',
    drawing_no: '',
    rev_no: '',
    net_wt: undefined,
    thickness: undefined,
    tool_information: '',
    raw_material: '',
    drawing_location: '',
    operation_sequence: '',
    lead_time: undefined,
    po_no: '',
    po_date: '',
    po_received: false,
    po_qty: undefined,
    po_drg_rev: '',
    acknowledgement_remarks: '',
    reqd_date_as_per_po: '',
    comp_name: ''
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  useEffect(() => {
    if (part && isOpen) {
      setFormData({
        customer_id: part.customer_id,
        part_description: part.part_description,
        drawing_no: part.drawing_no,
        rev_no: part.rev_no || '',
        net_wt: part.net_wt ? parseFloat(part.net_wt.toString()) : undefined,
        thickness: part.thickness ? parseFloat(part.thickness.toString()) : undefined,
        tool_information: part.tool_information || '',
        raw_material: part.raw_material || '',
        drawing_location: part.drawing_location || '',
        operation_sequence: part.operation_sequence || '',
        lead_time: part.lead_time ? parseInt(part.lead_time.toString()) : undefined,
        po_no: part.po_no || '',
        po_date: part.po_date ? part.po_date.split('T')[0] : '',
        po_received: part.po_received || false,
        po_qty: part.po_qty ? parseInt(part.po_qty.toString()) : undefined,
        po_drg_rev: part.po_drg_rev || '',
        acknowledgement_remarks: part.acknowledgement_remarks || '',
        reqd_date_as_per_po: part.reqd_date_as_per_po ? part.reqd_date_as_per_po.split('T')[0] : '',
        comp_name: (part as any).comp_name || ''
      })
      setErrors({})
    }
  }, [part, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev: CreatePartRequest) => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : Number(value)
      setFormData((prev: CreatePartRequest) => ({ ...prev, [name]: numValue }))
    } else if (name === 'customer_id') {
      const customerId = value === '' ? 0 : Number(value)
      setFormData((prev: CreatePartRequest) => ({ ...prev, [name]: customerId }))
    } else {
      setFormData((prev: CreatePartRequest) => ({ ...prev, [name]: value }))
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof CreatePartRequest]) {
      setErrors((prev: Partial<CreatePartRequest>) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev: CreatePartRequest) => ({ ...prev, comp_name: e.target.value }))
    // Clear error when user selects a company
    if (errors.comp_name) {
      setErrors((prev: Partial<CreatePartRequest>) => ({ ...prev, comp_name: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customer_id || formData.customer_id === 0) {
      newErrors.customer_id = 'Customer is required'
    }
    if (!formData.comp_name?.trim()) {
      newErrors.comp_name = 'Company selection is required'
    }
    if (!formData.part_description?.trim()) {
      newErrors.part_description = 'Part description is required'
    }
    if (!formData.drawing_no?.trim()) {
      newErrors.drawing_no = 'Drawing number is required'
    }

    setErrors(newErrors as Partial<CreatePartRequest>)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !part) return

    setIsSubmitting(true)
    try {
      const response = await partApi.updatePart(part.id, formData)
      if (response.success) {
        onSuccess()
        handleClose()
      }
    } catch (error) {
      console.error('Error updating part:', error)
      alert('Failed to update part')
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
      net_wt: undefined,
      thickness: undefined,
      tool_information: '',
      raw_material: '',
      drawing_location: '',
      operation_sequence: '',
      lead_time: undefined,
      po_no: '',
      po_date: '',
      po_received: false,
      po_qty: undefined,
      po_drg_rev: '',
      acknowledgement_remarks: '',
      reqd_date_as_per_po: '',
      comp_name: ''
    })
    setErrors({})
    onClose()
  }

  if (!isOpen || !part) return null

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
                  Edit Part
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
                    <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                      Customer *
                    </label>
                    <select
                      id="customer_id"
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.customer_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value={0}>Select a customer</option>
                      {/* We would need to fetch customers here or pass them as props */}
                    </select>
                    {errors.customer_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company *
                    </label>
                    <select
                      id="company"
                      name="company"
                      value={formData.comp_name}
                      onChange={handleCompanyChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.comp_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
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
                    <label htmlFor="part_description" className="block text-sm font-medium text-gray-700">
                      Part Description *
                    </label>
                    <textarea
                      id="part_description"
                      name="part_description"
                      value={formData.part_description}
                      onChange={handleInputChange}
                      rows={3}
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
                    <label htmlFor="drawing_no" className="block text-sm font-medium text-gray-700">
                      Drawing Number *
                    </label>
                    <input
                      type="text"
                      id="drawing_no"
                      name="drawing_no"
                      value={formData.drawing_no}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.drawing_no ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter drawing number"
                      disabled={isSubmitting}
                    />
                    {errors.drawing_no && (
                      <p className="mt-1 text-sm text-red-600">{errors.drawing_no}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="rev_no" className="block text-sm font-medium text-gray-700">
                      Revision Number
                    </label>
                    <input
                      type="text"
                      id="rev_no"
                      name="rev_no"
                      value={formData.rev_no}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter revision number"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="net_wt" className="block text-sm font-medium text-gray-700">
                      Net Weight
                    </label>
                    <input
                      type="number"
                      id="net_wt"
                      name="net_wt"
                      value={formData.net_wt || ''}
                      onChange={handleInputChange}
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter net weight"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="thickness" className="block text-sm font-medium text-gray-700">
                      Thickness
                    </label>
                    <input
                      type="number"
                      id="thickness"
                      name="thickness"
                      value={formData.thickness || ''}
                      onChange={handleInputChange}
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter thickness"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tool_information" className="block text-sm font-medium text-gray-700">
                      Tool Information
                    </label>
                    <textarea
                      id="tool_information"
                      name="tool_information"
                      value={formData.tool_information}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter tool information"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="raw_material" className="block text-sm font-medium text-gray-700">
                      Raw Material
                    </label>
                    <textarea
                      id="raw_material"
                      name="raw_material"
                      value={formData.raw_material}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter raw material"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="drawing_location" className="block text-sm font-medium text-gray-700">
                      Drawing Location
                    </label>
                    <textarea
                      id="drawing_location"
                      name="drawing_location"
                      value={formData.drawing_location}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter drawing location"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="operation_sequence" className="block text-sm font-medium text-gray-700">
                      Operation Sequence
                    </label>
                    <textarea
                      id="operation_sequence"
                      name="operation_sequence"
                      value={formData.operation_sequence}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter operation sequence"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lead_time" className="block text-sm font-medium text-gray-700">
                      Lead Time (days)
                    </label>
                    <input
                      type="number"
                      id="lead_time"
                      name="lead_time"
                      value={formData.lead_time || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter lead time in days"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="po_no" className="block text-sm font-medium text-gray-700">
                      PO Number
                    </label>
                    <input
                      type="text"
                      id="po_no"
                      name="po_no"
                      value={formData.po_no}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter PO number"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="po_qty" className="block text-sm font-medium text-gray-700">
                      PO Quantity
                    </label>
                    <input
                      type="number"
                      id="po_qty"
                      name="po_qty"
                      value={formData.po_qty || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter PO quantity"
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
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
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                      placeholder="Enter acknowledgement remarks"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="reqd_date_as_per_po" className="block text-sm font-medium text-gray-700">
                      Required Date as per PO
                    </label>
                    <input
                      type="date"
                      id="reqd_date_as_per_po"
                      name="reqd_date_as_per_po"
                      value={formData.reqd_date_as_per_po}
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
                {isSubmitting ? 'Updating...' : 'Update Part'}
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

export default EditPartModal
