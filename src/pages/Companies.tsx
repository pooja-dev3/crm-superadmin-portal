import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Power, PowerOff, MoreVertical } from 'lucide-react'
import { superadminApi } from '../services/superadminApi'
import type { Company } from '../services/companies'
import AddCompanyModal from '../components/AddCompanyModal'
import EditCompanyModal from '../components/EditCompanyModal'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; company: Company | null; newStatus: boolean }>({ isOpen: false, company: null, newStatus: false })
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; companyId: string | null; companyName: string }>({ isOpen: false, companyId: null, companyName: '' })
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)
  const [isBackendPaginated, setIsBackendPaginated] = useState(false)

  const navigate = useNavigate()

  const fetchCompanies = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await superadminApi.getCompanies(page) as { success: boolean; data: any; pagination?: any }

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

        // Handle pagination from backend if available, otherwise calculate locally
        if (response.data && response.data.current_page) {
          setCurrentPage(response.data.current_page)
          setTotalPages(response.data.last_page || Math.ceil((response.data.total || 0) / (response.data.per_page || itemsPerPage)))
          setTotalItems(response.data.total || mappedCompanies.length)
          setIsBackendPaginated(true)
        } else if (response.pagination) {
          setCurrentPage(response.pagination.current_page)
          setTotalPages(response.pagination.last_page)
          setTotalItems(response.pagination.total)
          setIsBackendPaginated(true)
        } else {
          // Calculate pagination locally
          const total = mappedCompanies.length
          const lastPage = Math.ceil(total / itemsPerPage)
          setCurrentPage(page)
          setTotalPages(lastPage > 0 ? lastPage : 1)
          setTotalItems(total)
          setIsBackendPaginated(false)
        }
      } else {
        setCompanies([])
        setFilteredCompanies([])
        setCurrentPage(1)
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      setCompanies([])
      setFilteredCompanies([])
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
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

    // Reset to first page when filters change
    setCurrentPage(1)
  }, [companies, searchTerm, statusFilter])

  // Get paginated data for current page
  const getPaginatedData = () => {
    if (isBackendPaginated) {
      // Backend pagination - return data as-is (already paginated)
      return filteredCompanies
    } else {
      // Local pagination - slice the filtered data
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      return filteredCompanies.slice(startIndex, endIndex)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)

      if (isBackendPaginated) {
        // Backend pagination - fetch new page data from API
        fetchCompanies(page)
      }
    }
  }

  const handleViewCompany = (companyId: string) => {
    navigate(`/companies/${companyId}`)
  }

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setShowEditModal(true)
  }

  const handleToggleStatus = (company: Company) => {
    const newStatus = !company.is_active
    setStatusConfirm({
      isOpen: true,
      company,
      newStatus
    })
  }

  const confirmToggleStatus = async () => {
    if (statusConfirm.company) {
      try {
        // Update the company status via API
        const response = await superadminApi.updateCompany(statusConfirm.company.id, {
          ...statusConfirm.company,
          is_active: statusConfirm.newStatus
        }) as { success: boolean; data: { id: number } }

        if (response.success) {
          // Update local state
          setCompanies(prev =>
            prev.map(c =>
              c.id === statusConfirm.company!.id
                ? { ...c, is_active: statusConfirm.newStatus }
                : c
            )
          )
          // Show success toast
          addToast(`Company ${statusConfirm.newStatus ? 'activated' : 'deactivated'} successfully`, 'success')
        } else {
          addToast('Failed to update company status', 'error')
        }
      } catch (error) {
        console.error('Error toggling company status:', error)
        addToast('Error updating company status', 'error')
      }
    }
    setStatusConfirm({ isOpen: false, company: null, newStatus: false })
  }

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    setDeleteConfirm({
      isOpen: true,
      companyId,
      companyName
    })
  }

  const confirmDeleteCompany = async () => {
    if (deleteConfirm.companyId) {
      try {
        const response = await superadminApi.deleteCompany(parseInt(deleteConfirm.companyId)) as { success: boolean }
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
          addToast('Company deleted successfully', 'success')
        } else {
          addToast('Failed to delete company', 'error')
        }
      } catch (error) {
        console.error('Error deleting company:', error)
        addToast('Failed to delete company', 'error')
      }
    }
    setDeleteConfirm({ isOpen: false, companyId: null, companyName: '' })
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
        gst: companyData.gst_no || companyData.gst,
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
      addToast(error instanceof Error ? error.message : 'Failed to create company', 'error')
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
        status: companyData.is_active ? 'active' : 'inactive', // Map to API field name
        is_active: companyData.is_active
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
      addToast(error instanceof Error ? error.message : 'Failed to update company', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <LoadingSpinner size="lg" />
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
        <div className="bg-white shadow-sm border border-gray-100 sm:rounded-xl overflow-hidden animate-fade-in-scale">
          <div className="overflow-x-auto custom-scrollbar relative">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16 whitespace-nowrap">
                    Sr No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Company Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50/90 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {getPaginatedData().map((company, index) => (
                  <tr key={company.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400 group-hover:text-blue-500 transition-colors">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white shadow-sm mr-3 flex-shrink-0">
                          {company.comp_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{company.comp_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs tracking-wider border border-gray-200">{company.code || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${company.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${company.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {company.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {company.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={company.address}>
                      {company.address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {company.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
                      {new Date(company.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors">
                      <div className="relative flex justify-end items-center" ref={activeDropdown === company.id ? dropdownRef : null}>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === company.id ? null : company.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {/* Abstracted Dropdown Menu */}
                        {activeDropdown === company.id && (
                          <div className="absolute right-8 top-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in-scale origin-top-right overflow-hidden">
                            <div className="py-1">
                              <button
                                onClick={() => { navigate(`/companies/${company.id}`); setActiveDropdown(null) }}
                                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              >
                                <Eye className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                View Details
                              </button>
                              <button
                                onClick={() => { handleEditCompany(company); setActiveDropdown(null) }}
                                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                              >
                                <Edit className="mr-3 h-4 w-4 text-gray-400 group-hover:text-yellow-500" />
                                Edit Company
                              </button>
                              <button
                                onClick={() => { handleToggleStatus(company); setActiveDropdown(null) }}
                                className={`group flex w-full items-center px-4 py-2 text-sm transition-colors ${company.is_active ? 'hover:bg-orange-50 text-gray-700 hover:text-orange-700' : 'hover:bg-green-50 text-gray-700 hover:text-green-700'}`}
                              >
                                {company.is_active ? (
                                  <>
                                    <PowerOff className="mr-3 h-4 w-4 text-gray-400 group-hover:text-orange-500" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Power className="mr-3 h-4 w-4 text-gray-400 group-hover:text-green-500" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => { handleDeleteCompany(company.id.toString(), company.comp_name); setActiveDropdown(null) }}
                                className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600" />
                                Delete Company
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-100 sm:px-6 shadow-sm rounded-xl">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {isBackendPaginated ? Math.min(currentPage * itemsPerPage, totalItems) : Math.min(currentPage * itemsPerPage, filteredCompanies.length)}
                  </span>{' '}
                  of <span className="font-medium">{isBackendPaginated ? totalItems : filteredCompanies.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show standard pagination for few pages, or simplified for many
                    if (
                      totalPages <= 7 ||
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {filteredCompanies.length === 0 && (
          <EmptyState
            title="No companies found"
            message={searchTerm ? `No results for "${searchTerm}". Try a different search term.` : "No companies are available currently."}
            className="mt-6"
          />
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

      {/* Status Toggle Confirmation Modal */}
      <ConfirmModal
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, company: null, newStatus: false })}
        onConfirm={confirmToggleStatus}
        title={`${statusConfirm.newStatus ? 'Activate' : 'Deactivate'} Company`}
        message={`Are you sure you want to ${statusConfirm.newStatus ? 'activate' : 'deactivate'} "${statusConfirm.company?.comp_name || ''}"?`}
        confirmText={statusConfirm.newStatus ? 'Activate' : 'Deactivate'}
        cancelText="Cancel"
        type={statusConfirm.newStatus ? 'info' : 'warning'}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, companyId: null, companyName: '' })}
        onConfirm={confirmDeleteCompany}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteConfirm.companyName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  )
}

export default Companies