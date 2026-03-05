import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { adminApi, type Admin, type UpdateAdminRequest } from '../services/admin'
import { superadminApi } from '../services/superadminApi'
import type { PaginatedCompaniesResponse } from '../services/companies'
import type { ApiResponse } from '../types/api'
import { useToast } from '../contexts/ToastContext'

interface EditAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  admin: Admin
}

const EditAdminModal: React.FC<EditAdminModalProps> = ({ isOpen, onClose, onSuccess, admin }) => {
  const [formData, setFormData] = useState({
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    is_active: admin.is_active,
    comp_code: ''
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value
    const company = companies.find(c => c.id.toString() === companyId)

    if (company) {
      setSelectedCompany(company)
      setFormData((prev) => ({
        ...prev,
        comp_code: company.code
      }))
    } else {
      setSelectedCompany(null)
      setFormData((prev) => ({
        ...prev,
        comp_code: ''
      }))
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await superadminApi.getCompanies() as PaginatedCompaniesResponse
      if (response.success && response.data && Array.isArray(response.data.data)) {
        setCompanies(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  // Fetch companies when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchCompanies()
    }
  }, [isOpen])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value)
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces'
    }

    // Email validation
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    } else if (formData.email.trim().length > 255) {
      newErrors.email = 'Email must be less than 255 characters'
    }

    // Phone validation
    const phoneClean = formData.phone?.trim().replace(/\s/g, '')
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^(?:\+91|91|0)?[6-9]\d{9}$/.test(phoneClean)) {
      newErrors.phone = 'Please enter a valid Indian phone number (e.g. +91 9876543210)'
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required'
    } else if (!['admin', 'supervisor', 'operator'].includes(formData.role)) {
      newErrors.role = 'Invalid role selected'
    }

    // New password validation (optional)
    if (newPassword) {
      if (newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters'
      } else if (newPassword.length > 128) {
        newErrors.newPassword = 'Password must be less than 128 characters'
      } else if (!/(?=.*[a-z])/.test(newPassword)) {
        newErrors.newPassword = 'Password must contain at least one lowercase letter'
      } else if (!/(?=.*[A-Z])/.test(newPassword)) {
        newErrors.newPassword = 'Password must contain at least one uppercase letter'
      } else if (!/(?=.*\d)/.test(newPassword)) {
        newErrors.newPassword = 'Password must contain at least one number'
      } else if (!/(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
        newErrors.newPassword = 'Password must contain at least one special character'
      }
    }

    // Company validation (optional but if selected, must be valid)
    if (selectedCompany && !selectedCompany.comp_name) {
      newErrors.comp_code = 'Invalid company selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Update admin details with company
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        is_active: formData.is_active,
        comp_name: selectedCompany?.comp_name || '', // Send company name instead of code
        comp_code: formData.comp_code
      }

      const response = await superadminApi.updateCompanyUser(admin.id, updateData) as ApiResponse<any>
      if (response.success) {
        // Password update is now handled within the same call if UpdateAdminRequest includes it,
        // but based on current implementation plan, we keep it separate or merged.
        // Actually, since I added 'password' to UpdateAdminRequest, I can merge it.
        if (newPassword) {
          await superadminApi.updateCompanyUser(admin.id, { ...updateData, password: newPassword })
        }
        addToast('Admin updated successfully', 'success')
        onSuccess()
      } else {
        addToast('Failed to update admin', 'error')
      }
    } catch (error) {
      console.error('Error updating admin:', error)
      addToast('Failed to update admin', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        is_active: admin.is_active,
        comp_code: ''
      })
      setNewPassword('')
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
          {/* Header - Sticky */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Admin</h3>
                <p className="mt-1 text-sm text-gray-500">Update administrator account details</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                disabled={isLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            <form id="edit-admin-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm transition-all ${errors.name ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-300 hover:border-blue-300'
                      }`}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm transition-all ${errors.email ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-300 hover:border-blue-300'
                      }`}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm transition-all ${errors.phone ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-300 hover:border-blue-300'
                      }`}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCompany?.id || ''}
                    onChange={handleCompanyChange}
                    className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm transition-all ${errors.comp_code ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-300 hover:border-blue-300'
                      }`}
                    disabled={isLoading}
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.comp_name}
                      </option>
                    ))}
                  </select>
                  {selectedCompany && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">Code:</span> {selectedCompany.code}
                      </p>
                    </div>
                  )}
                  {errors.comp_code && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.comp_code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm transition-all ${errors.role ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-300 hover:border-blue-300'
                      }`}
                    disabled={isLoading}
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="operator">Operator</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.role}
                    </p>
                  )}
                </div>

                <div className="flex items-center mt-8">
                  <div className="relative flex items-center h-5">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-900 focus:ring-blue-900 border-gray-300 rounded-md transition-all cursor-pointer"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="is_active" className="text-sm font-semibold text-gray-900 cursor-pointer">
                      Active Account
                    </label>
                  </div>
                </div>
              </div>

              {/* Password Reset Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-700 p-1 rounded mr-2">
                    <Eye className="h-4 w-4" />
                  </span>
                  Reset Password
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password <span className="text-xs text-gray-500 font-normal ml-1">(leave empty to keep current)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm transition-all ${errors.newPassword ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-300 hover:border-blue-300'
                          }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 px-3.5 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center">
                        <X className="h-3 w-3 mr-1" />
                        {errors.newPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer - Sticky */}
          <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 italic">
                * Fields marked with asterisk are mandatory
              </span>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-all"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-admin-form"
                  className="px-8 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-all flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Admin...
                    </>
                  ) : (
                    'Update Admin'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditAdminModal
