import React, { useState, useEffect } from 'react'
import { X, Save, Package, Building, Calendar, Info, Wrench, MapPin, Hash, ClipboardList } from 'lucide-react'
import { partApi } from '../services/parts'
import { companyApi, type Company } from '../services/companies'
import { customerApi } from '../services/customers'
import type { PartWithCustomer, CreatePartRequest, Customer } from '../types/api'
import { useToast } from '../contexts/ToastContext'

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
  const [companies, setCompanies] = useState<Company[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [errors, setErrors] = useState<Partial<CreatePartRequest>>({})
  const { addToast } = useToast()

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
        net_wt: part.net_wt ? parseFloat(part.net_wt.toString()) : 0,
        thickness: part.thickness ? parseFloat(part.thickness.toString()) : 0,
        tool_information: part.tool_information || '',
        raw_material: part.raw_material || '',
        drawing_location: part.drawing_location || '',
        operation_sequence: part.operation_sequence || '',
        lead_time: part.lead_time ? parseInt(part.lead_time.toString()) : 0,
        po_no: part.po_no || '',
        po_date: part.po_date ? part.po_date.split('T')[0] : '',
        po_received: part.po_received || false,
        po_qty: part.po_qty ? parseInt(part.po_qty.toString()) : 0,
        po_drg_rev: part.po_drg_rev || '',
        acknowledgement_remarks: part.acknowledgement_remarks || '',
        reqd_date_as_per_po: part.reqd_date_as_per_po ? part.reqd_date_as_per_po.split('T')[0] : '',
        comp_name: (part as any).comp_name || ''
      })
      if ((part as any).comp_name) {
        fetchCustomersForCompany((part as any).comp_name)
      }
    }
  }, [part, isOpen])

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

        const companyCustomers = customersData.filter(customer => {
          const customerCompany = (customer as any).company_name || (customer as any).comp_name || (customer as any).company
          return customerCompany === companyName || !customerCompany
        })
        setCustomers(companyCustomers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (errors[name as keyof CreatePartRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyName = e.target.value
    setFormData(prev => ({ ...prev, comp_name: companyName, customer_id: 0 }))
    fetchCustomersForCompany(companyName)
    if (errors.comp_name) setErrors(prev => ({ ...prev, comp_name: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.customer_id) newErrors.customer_id = 'Required'
    if (!formData.comp_name.trim()) newErrors.comp_name = 'Required'
    if (!formData.part_description.trim()) newErrors.part_description = 'Required'
    if (!formData.drawing_no.trim()) newErrors.drawing_no = 'Required'
    if (!formData.net_wt || formData.net_wt <= 0) newErrors.net_wt = '> 0'
    if (!formData.thickness || formData.thickness <= 0) newErrors.thickness = '> 0'
    if (!formData.lead_time || formData.lead_time <= 0) newErrors.lead_time = '> 0'
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
        addToast('Part updated successfully', 'success')
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error updating part:', error)
      addToast('Update failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !part) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Sticky Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Save className="h-6 w-6 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Part</h3>
                  <p className="text-sm text-gray-500 tracking-tight">Modify part specifications</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="space-y-8">
                {/* Section 1: Company & Customer */}
                <div>
                  <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                    <Building className="h-4 w-4 mr-2" /> Company & Customer
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Company <span className="text-red-500">*</span></label>
                      <select name="comp_name" value={formData.comp_name} onChange={handleCompanyChange} className={`block w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none transition-all ${errors.comp_name ? 'border-red-500' : 'border-gray-200'}`}>
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c.id} value={c.comp_name}>{c.comp_name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Customer <span className="text-red-500">*</span></label>
                      <select name="customer_id" value={formData.customer_id || ''} onChange={handleInputChange} disabled={!formData.comp_name || isLoadingCustomers} className={`block w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none transition-all disabled:bg-gray-100 ${errors.customer_id ? 'border-red-500' : 'border-gray-200'}`}>
                        <option value="">{isLoadingCustomers ? 'Loading...' : 'Select Customer'}</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Part Specs */}
                <div>
                  <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                    <Package className="h-4 w-4 mr-2" /> Part Specifications
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl">
                    <div className="md:col-span-2 lg:col-span-3 space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
                      <input type="text" name="part_description" value={formData.part_description} onChange={handleInputChange} className={`block w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-900 transition-all ${errors.part_description ? 'border-red-500' : 'border-gray-200'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Drawing No <span className="text-red-500">*</span></label>
                      <input type="text" name="drawing_no" value={formData.drawing_no} onChange={handleInputChange} className={`block w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-900 transition-all ${errors.drawing_no ? 'border-red-500' : 'border-gray-200'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Revision No</label>
                      <input type="text" name="rev_no" value={formData.rev_no} onChange={handleInputChange} className="block w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Net Weight <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" name="net_wt" value={formData.net_wt} onChange={handleInputChange} className={`block w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-900 transition-all ${errors.net_wt ? 'border-red-500' : 'border-gray-200'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Thickness <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" name="thickness" value={formData.thickness} onChange={handleInputChange} className={`block w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-900 transition-all ${errors.thickness ? 'border-red-500' : 'border-gray-200'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Lead Time <span className="text-red-500">*</span></label>
                      <input type="number" name="lead_time" value={formData.lead_time} onChange={handleInputChange} className={`block w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-900 transition-all ${errors.lead_time ? 'border-red-500' : 'border-gray-200'}`} />
                    </div>
                  </div>
                </div>

                {/* Section 3: Manufacturing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                      <Wrench className="h-4 w-4 mr-2" /> Manufacturing
                    </h4>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Tool Information</label>
                        <input type="text" name="tool_information" value={formData.tool_information} onChange={handleInputChange} className="block w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Drawing Location</label>
                        <input type="text" name="drawing_location" value={formData.drawing_location} onChange={handleInputChange} className="block w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Operation Sequence</label>
                        <textarea name="operation_sequence" value={formData.operation_sequence} onChange={handleInputChange} rows={3} className="block w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 transition-all resize-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                      <ClipboardList className="h-4 w-4 mr-2" /> Purchase Order
                    </h4>
                    <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-blue-900/60 uppercase">PO No</label>
                          <input type="text" name="po_no" value={formData.po_no} onChange={handleInputChange} className="block w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg outline-none text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-blue-900/60 uppercase">PO Date</label>
                          <input type="date" name="po_date" value={formData.po_date} onChange={handleInputChange} className="block w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg outline-none text-sm" />
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer pt-2">
                        <input type="checkbox" name="po_received" checked={formData.po_received} onChange={handleInputChange} className="h-4 w-4 text-blue-900 border-gray-300 rounded" />
                        <span className="text-sm font-bold text-blue-900">PO Received</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row-reverse gap-3 sticky bottom-0 z-10">
              <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent shadow-md px-6 py-2.5 bg-blue-900 text-sm font-bold text-white hover:bg-blue-800 transition-all disabled:opacity-50 active:scale-95">
                {isSubmitting ? 'Updating...' : 'Update Part'}
              </button>
              <button type="button" onClick={onClose} className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-6 py-2.5 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
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
