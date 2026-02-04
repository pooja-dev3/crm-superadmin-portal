import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Ban, CheckCircle, XCircle, Mail, Phone, MapPin, FileText, Calendar } from 'lucide-react'
import { companyApi } from '../services'
import type { Company } from '../services/companies'
import EditCompanyModal from '../components/EditCompanyModal'

interface CompanyFormData {
  company_name: string
  email: string
  address: string
  phone: string
  gst_no: string
  is_active: boolean
}

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCompany(id)
    }
  }, [id])

  const fetchCompany = async (companyId: string) => {
    try {
      const response = await companyApi.getCompanyById(parseInt(companyId))
      if (response.success) {
        setCompany(response.data)
      } else {
        setCompany(null)
      }
    } catch (error) {
      console.error('Error fetching company:', error)
      setCompany(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleEditSubmit = async (companyData: CompanyFormData) => {
    if (!company) return
    
    try {
      const response = await companyApi.updateCompany(company.id, {
        company_name: companyData.company_name,
        email: companyData.email,
        address: companyData.address,
        phone: companyData.phone,
        gst_no: companyData.gst_no,
        is_active: companyData.is_active
      })
      
      if (response.success) {
        setShowEditModal(false)
        // Refresh company data
        await fetchCompany(company.id.toString())
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Failed to update company')
    }
  }

  const handleToggleStatus = async () => {
    if (!company) return
    
    const confirmMessage = company.is_active 
      ? `Are you sure you want to deactivate "${company.company_name}"?`
      : `Are you sure you want to activate "${company.company_name}"?`
    
    if (confirm(confirmMessage)) {
      try {
        const response = await companyApi.toggleCompanyStatus(company.id)
        if (response.success) {
          // Refresh company data
          await fetchCompany(company.id.toString())
        }
      } catch (error) {
        console.error('Error updating company status:', error)
        alert('Failed to update company status')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company not found</h2>
          <button
            onClick={() => navigate('/companies')}
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
          >
            Back to Companies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/companies')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Companies
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Company Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleToggleStatus}
                className={`flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  company.is_active
                    ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                    : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                }`}
              >
                {company.is_active ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            {/* Company Header */}
            <div className="bg-blue-900 px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{company.company_name}</h2>
                  <div className="flex items-center mt-2">
                    {company.is_active ? (
                      <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="px-6 py-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{company.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{company.phone}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">{company.address || 'No address provided'}</p>
                  </div>
                </div>

                {/* GST Number */}
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">GST Number</p>
                    <p className="text-sm text-gray-600">{company.gst_no}</p>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created Date</p>
                    <p className="text-sm text-gray-600">{new Date(company.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Updated Date */}
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">{new Date(company.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditCompanyModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          company={company}
        />
      )}
    </div>
  )
}

export default CompanyDetail
