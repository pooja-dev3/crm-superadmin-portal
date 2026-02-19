import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { Company } from '../services/companies'
import AddCompanyModal from '../components/AddCompanyModal'
import EditCompanyModal from '../components/EditCompanyModal'
import { useToast } from '../contexts/ToastContext'

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const { addToast } = useToast()

  const navigate = useNavigate()

  useEffect(() => {
    // Fetch real companies data
    const fetchCompanies = async () => {
      try {
        const response = await superadminApi.getCompanies() as { success: boolean; data: any }
        
        // Handle both real API and mock API response structures
        let companiesData: any[] = []
        
        if (response.success) {
          if (Array.isArray(response.data)) {
            // Real API returns data directly as array
            companiesData = response.data
          } else if (response.data && Array.isArray(response.data.data)) {
            // Mock API returns paginated structure
            companiesData = response.data.data
          }
        }
        
        // Map API response to frontend interface
        const mappedCompanies = companiesData.map((company: any) => ({
          id: company.id,
          comp_name: company.comp_name || company.company_name || '',
          email: company.email || '',
          address: company.address || '',
          phone: company.phno || company.phone || '',
          gst_no: company.gst || company.gst_no || '',
          code: company.code || company.company_code || '',
          phno: company.phno || company.phone || '',
          is_active: company.status === 'active' || company.is_active || false,
          created_at: company.created_at || new Date().toISOString(),
          updated_at: company.updated_at || new Date().toISOString()
        }))
        
        // Sort by created_at descending (newest first)
        const sortedCompanies = mappedCompanies.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setCompanies(sortedCompanies)
        setFilteredCompanies(sortedCompanies)
      } catch (error) {
        console.error('Error fetching companies:', error)
        // Set empty arrays to prevent map errors
        setCompanies([])
        setFilteredCompanies([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  useEffect(() => {
    let filtered = companies

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.comp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => 
        statusFilter === 'active' ? company.is_active : !company.is_active
      )
    }

    setFilteredCompanies(filtered)
  }, [companies, searchTerm, statusFilter])

  const handleViewCompany = (companyId: string) => {
    navigate(`/companies/${companyId}`)
  }

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setShowEditModal(true)
  }

  const handleToggleStatus = async (company: Company) => {
    try {
      const newStatus = !company.is_active
      const confirmMessage = `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${company.comp_name}"?`
      
      if (window.confirm(confirmMessage)) {
        // Update the company status via API
        const response = await superadminApi.updateCompany(company.id, {
          ...company,
          is_active: newStatus
        }) as { success: boolean; data: { id: number } }
        
        if (response.success) {
          // Update local state
          setCompanies(prev => 
            prev.map(c => 
              c.id === company.id 
                ? { ...c, is_active: newStatus }
                : c
            )
          )
          // Show success toast
          addToast(`Company ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success')
        } else {
          addToast('Failed to update company status', 'error')
        }
      }
    } catch (error) {
      console.error('Error toggling company status:', error)
      addToast('Error updating company status', 'error')
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    const company = companies.find(c => c.id.toString() === companyId)
    if (company) {
      const confirmMessage = `Are you sure you want to delete "${company.comp_name}"? This action cannot be undone.`
      
      if (confirm(confirmMessage)) {
        try {
          const response = await superadminApi.deleteCompany(parseInt(companyId)) as { success: boolean }
          if (response.success) {
            // Refresh companies list
            const companiesResponse = await superadminApi.getCompanies() as { success: boolean; data: any }
            if (companiesResponse.success) {
              let companiesData: any[] = []
              if (Array.isArray(companiesResponse.data)) {
                companiesData = companiesResponse.data
              } else if (companiesResponse.data && Array.isArray(companiesResponse.data.data)) {
                companiesData = companiesResponse.data.data
              }
              
              const mappedCompanies = companiesData.map((company: any) => ({
                id: company.id,
                comp_name: company.comp_name || company.company_name || '',
                email: company.email || '',
                address: company.address || '',
                phone: company.phno || company.phone || '',
                gst_no: company.gst || company.gst_no || '',
                code: company.code || company.company_code || '',
                phno: company.phno || company.phone || '',
                is_active: company.status === 'active' || company.is_active || false,
                created_at: company.created_at || new Date().toISOString(),
                updated_at: company.updated_at || new Date().toISOString()
              }))
              
              // Sort by created_at descending (newest first)
              const sortedCompanies = mappedCompanies.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              
              setCompanies(sortedCompanies)
              setFilteredCompanies(sortedCompanies)
            }
          }
        } catch (error) {
          console.error('Error deleting company:', error)
          alert('Failed to delete company')
        }
      }
    }
  }

  const handleAddCompany = () => {
    setShowAddModal(true)
  }

  const handleSubmitCompany = async (companyData: any) => {
    try {
      const response = await superadminApi.createCompany({
        comp_name: companyData.company_name || companyData.comp_name,
        code: companyData.code || companyData.company_code,
        email: companyData.email,
        address: companyData.address,
        phno: companyData.phone || companyData.phno,
        gst_no: companyData.gst_no || companyData.gst,
        status: companyData.is_active ? 'active' : 'inactive'
      }) as { success: boolean; data: any }

      if (response.success) {
        // Refresh companies list
        const companiesResponse = await superadminApi.getCompanies() as { success: boolean; data: any }
        if (companiesResponse.success) {
          let companiesData: any[] = []
          if (Array.isArray(companiesResponse.data)) {
            companiesData = companiesResponse.data
          } else if (companiesResponse.data && Array.isArray(companiesResponse.data.data)) {
            companiesData = companiesResponse.data.data
          }
          
          const mappedCompanies = companiesData.map((company: any) => ({
            id: company.id,
            comp_name: company.comp_name || company.company_name || '',
            email: company.email || '',
            address: company.address || '',
            phone: company.phno || company.phone || '',
            gst_no: company.gst || company.gst_no || '',
            code: company.code || company.company_code || '',
            is_active: company.status === 'active' || company.is_active || false,
            created_at: company.created_at || new Date().toISOString(),
            updated_at: company.updated_at || new Date().toISOString()
          }))
          
          // Sort by created_at descending (newest first)
          const sortedCompanies = mappedCompanies.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          
          setCompanies(sortedCompanies)
          setFilteredCompanies(sortedCompanies)
        }
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Error creating company:', error)
      alert(error instanceof Error ? error.message : 'Failed to create company')
    }
  }

  const handleEditSubmit = async (companyData: any) => {
    if (!selectedCompany) return
    
    try {
      const response = await superadminApi.updateCompany(selectedCompany.id, {
        comp_name: companyData.company_name, // Map to API field name
        email: companyData.email,
        address: companyData.address,
        phno: companyData.phone, // Map to API field name
        gst: companyData.gst_no, // Map to API field name
        status: companyData.is_active ? 'active' : 'inactive' // Map to API field name
      }) as { success: boolean; data: any }
      
      if (response.success) {
        setShowEditModal(false)
        setSelectedCompany(null)
        // Refresh companies list
        const companiesResponse = await superadminApi.getCompanies() as { success: boolean; data: any }
        if (companiesResponse.success) {
          let companiesData: any[] = []
          if (Array.isArray(companiesResponse.data)) {
            companiesData = companiesResponse.data
          } else if (companiesResponse.data && Array.isArray(companiesResponse.data.data)) {
            companiesData = companiesResponse.data.data
          }
          
          const mappedCompanies = companiesData.map((company: any) => ({
            id: company.id,
            comp_name: company.comp_name || company.company_name || '',
            email: company.email || '',
            address: company.address || '',
            phone: company.phno || company.phone || '',
            gst_no: company.gst || company.gst_no || '',
            code: company.code || company.company_code || '',
            is_active: company.status === 'active' || company.is_active || false,
            created_at: company.created_at || new Date().toISOString(),
            updated_at: company.updated_at || new Date().toISOString()
          }))
          
          // Sort by created_at descending (newest first)
          const sortedCompanies = mappedCompanies.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          
          setCompanies(sortedCompanies)
          setFilteredCompanies(sortedCompanies)
        }
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert(error instanceof Error ? error.message : 'Failed to update company')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all companies in the system
          </p>
        </div>
        <button
          onClick={handleAddCompany}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{company.comp_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.is_active ? (
                        <span className="w-4 h-4 mr-1">●</span>
                      ) : (
                        <span className="w-4 h-4 mr-1">●</span>
                      )}
                      {company.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(company)}
                        className={`p-1 rounded transition-colors ${
                          company.is_active 
                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={company.is_active ? 'Deactivate Company' : 'Activate Company'}
                      >
                        {company.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="text-yellow-600 hover:text-yellow-900 p-1"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id.toString())}
                        className="p-1 text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No companies found matching your criteria.</p>
        </div>
      )}
    </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <AddCompanyModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSubmitCompany}
        />
      )}

      {/* Edit Company Modal */}
      {showEditModal && (
        <EditCompanyModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCompany(null)
          }}
          onSubmit={handleEditSubmit}
          company={selectedCompany}
        />
      )}
    </>
  )
}

export default Companies