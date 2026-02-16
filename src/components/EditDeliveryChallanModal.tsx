import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { DeliveryChallan, UpdateDeliveryChallanRequest } from '../services/deliveryChallans'
import { customerApi } from '../services'

interface EditDeliveryChallanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  challan: DeliveryChallan | null
}

const EditDeliveryChallanModal: React.FC<EditDeliveryChallanModalProps> = ({ isOpen, onClose, onSuccess, challan }) => {
  const [formData, setFormData] = useState<UpdateDeliveryChallanRequest>({
    challanNumber: '',
    company: '',
    orderId: '',
    status: 'pending',
    deliveryDate: ''
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<UpdateDeliveryChallanRequest>>({})

  useEffect(() => {
    if (challan && isOpen) {
      setFormData({
        challanNumber: challan.challanNumber,
        company: challan.company,
        orderId: challan.orderId,
        status: challan.status,
        deliveryDate: challan.deliveryDate || ''
      })
      setErrors({})
      fetchCompanies()
    }
  }, [challan, isOpen])

  const fetchCompanies = async () => {
    try {
      const response = await customerApi.getAllCustomers()
      if (response.success) {
        let companiesData: any[] = []
        
        if (Array.isArray(response.data)) {
          // Real API returns simple array: { success: true, data: [...] }
          companiesData = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          // Mock API returns paginated: { success: true, data: { data: [...] } }
          companiesData = response.data.data
        }
        
        setCompanies(companiesData)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
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

    if (!formData.challanNumber?.trim()) {
      newErrors.challanNumber = 'Challan number is required'
    }
    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required'
    }
    if (!formData.orderId?.trim()) {
      newErrors.orderId = 'Order ID is required'
    }
    if (!formData.status) {
      newErrors.status = 'Status is required'
    }

    setErrors(newErrors as Partial<UpdateDeliveryChallanRequest>)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !challan) return

    setIsSubmitting(true)
    try {
      const response = await superadminApi.updateDeliveryChallan(parseInt(challan.id), formData) as { success: boolean }
      if (response.success) {
        onSuccess()
        handleClose()
      }
    } catch (error) {
      console.error('Error updating delivery challan:', error)
      alert('Failed to update delivery challan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      challanNumber: '',
      company: '',
      orderId: '',
      status: 'pending',
      deliveryDate: ''
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
                    <label htmlFor="challanNumber" className="block text-sm font-medium text-gray-700">
                      Challan Number *
                    </label>
                    <input
                      type="text"
                      id="challanNumber"
                      name="challanNumber"
                      value={formData.challanNumber}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.challanNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter challan number"
                      disabled={isSubmitting}
                    />
                    {errors.challanNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.challanNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company *
                    </label>
                    <select
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                        errors.company ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.comp_name || company.name}>
                          {company.comp_name || company.name}
                        </option>
                      ))}
                    </select>
                    {errors.company && (
                      <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                    Order ID *
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm ${
                      errors.orderId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter order ID"
                    disabled={isSubmitting}
                  />
                  {errors.orderId && (
                    <p className="mt-1 text-sm text-red-600">{errors.orderId}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <option value="pending">Pending</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      id="deliveryDate"
                      name="deliveryDate"
                      value={formData.deliveryDate}
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
