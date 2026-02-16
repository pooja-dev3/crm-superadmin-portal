import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { customerApi, type Customer, type UpdateCustomerRequest } from '../services/customers'
import { companyApi, type Company } from '../services/companies'

interface EditCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customer: Customer | null
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, onClose, onSuccess, customer }) => {
  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    name: '',
    address: '',
    contact_no: '',
    gst_no: '',
    comp_code: '',
    comp_name: '',
    is_active: true
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<UpdateCustomerRequest>>({})

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
      setCompanies([])
    }
  }

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name,
        address: customer.address,
        contact_no: customer.contact_no,
        gst_no: customer.gst_no,
        comp_code: customer.comp_code,
        comp_name: customer.comp_name,
        is_active: customer.is_active
      })
      setErrors({})
    }
  }, [customer, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof UpdateCustomerRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCompany = companies.find(comp => comp.comp_name === e.target.value)
    if (selectedCompany) {
      setFormData(prev => ({
        ...prev,
        comp_name: selectedCompany.comp_name,
        comp_code: selectedCompany.code
      }))
    }
    // Clear error when user selects a company
    if (errors.comp_name) {
      setErrors(prev => ({ ...prev, comp_name: undefined }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateCustomerRequest> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Customer name is required'
    }
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.contact_no?.trim()) {
      newErrors.contact_no = 'Contact number is required'
    }
    if (!formData.gst_no?.trim()) {
      newErrors.gst_no = 'GST number is required'
    }
    if (!formData.comp_name?.trim()) {
      newErrors.comp_name = 'Company selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !customer) return

    setIsSubmitting(true)
    try {
      const response = await customerApi.updateCustomer(customer.id, formData)
      if (response.success) {
        onSuccess()
        handleClose()
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Failed to update customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      contact_no: '',
      gst_no: '',
      comp_code: '',
      comp_name: '',
      is_active: true
    })
    setErrors({})
    onClose()
  }

  if (!isOpen || !customer) return null

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
                  Edit Customer
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
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter customer name"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter complete address"
                    disabled={isSubmitting}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact_no" className="block text-sm font-medium text-gray-700">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    id="contact_no"
                    name="contact_no"
                    value={formData.contact_no}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.contact_no ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter contact number"
                    disabled={isSubmitting}
                  />
                  {errors.contact_no && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact_no}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gst_no" className="block text-sm font-medium text-gray-700">
                    GST Number *
                  </label>
                  <input
                    type="text"
                    id="gst_no"
                    name="gst_no"
                    value={formData.gst_no}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.gst_no ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter GST number"
                    disabled={isSubmitting}
                  />
                  {errors.gst_no && (
                    <p className="mt-1 text-sm text-red-600">{errors.gst_no}</p>
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
                  <label htmlFor="comp_code" className="block text-sm font-medium text-gray-700">
                    Company Code
                  </label>
                  <input
                    type="text"
                    id="comp_code"
                    name="comp_code"
                    value={formData.comp_code}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-600 sm:text-sm"
                    placeholder="Auto-populated from company selection"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">Company code is auto-populated when you select a company</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Customer'}
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

export default EditCustomerModal
