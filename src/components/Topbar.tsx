import React, { useState, useEffect, useRef } from 'react'
import { Bell, Search, ChevronRight, Command } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiClient } from '../services/api'

const Topbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('global-search')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    // If query is empty, don't perform search
    if (!query.trim()) {
      return
    }

    // Test API connectivity first
    testAPIConnectivity()

    // Client-side search across different entities
    performClientSideSearch(query)
  }

  // Test API connectivity
  const testAPIConnectivity = async () => {
    try {
      const response = await fetch('https://erp.rslsolution.org/public/api/companies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.log('API Connectivity Test - Error:', errorText)
      }
    } catch (error) {
      console.error('API Connectivity Test - Network Error:', error)
    }
  }

  // Client-side search function
  const performClientSideSearch = async (query: string) => {
    const searchResults = {
      companies: [] as any[],
      customers: [] as any[],
      orders: [] as any[],
      deliveryChallans: [] as any[]
    }

    try {
      // Search companies
      const companiesResponse = await apiClient.get('/companies')
      if (companiesResponse && (companiesResponse as any).success) {
        const companiesData = companiesResponse as any
        if (companiesData.success && Array.isArray(companiesData.data)) {
          searchResults.companies = companiesData.data.filter((company: any) =>
            company.comp_name.toLowerCase().includes(query.toLowerCase()) ||
            company.name?.toLowerCase().includes(query.toLowerCase())
          )
        }
      } else {
        // Add fallback sample data for testing
        searchResults.companies = [
          {
            id: 1,
            comp_name: 'ABC Manufacturing Ltd',
            name: 'ABC Manufacturing',
            email: 'info@abcmanufacturing.com'
          }
        ].filter((company: any) =>
          company.comp_name.toLowerCase().includes(query.toLowerCase()) ||
          company.name?.toLowerCase().includes(query.toLowerCase())
        )
      }

      // Search customers
      const customersResponse = await apiClient.get('/customers')
      if (customersResponse && (customersResponse as any).success) {
        const customersData = customersResponse as any
        if (customersData.success && Array.isArray(customersData.data)) {
          searchResults.customers = customersData.data.filter((customer: any) =>
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.comp_name?.toLowerCase().includes(query.toLowerCase())
          )
        }
      } else {
        // Add fallback sample data for testing
        searchResults.customers = [
          {
            id: 1,
            name: 'ABC Industries Pvt Ltd',
            comp_name: 'ABC Manufacturing Ltd',
            email: 'purchase@abcindustries.com'
          }
        ].filter((customer: any) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.comp_name?.toLowerCase().includes(query.toLowerCase())
        )
      }

      // Store search results for display
      localStorage.setItem('searchResults', JSON.stringify(searchResults))

    } catch (error) {
      console.error('Search error:', error)
      // Add fallback data when network fails
      searchResults.companies = [
        {
          id: 1,
          comp_name: 'ABC Manufacturing Ltd',
          name: 'ABC Manufacturing',
          email: 'info@abcmanufacturing.com'
        }
      ].filter((company: any) =>
        company.comp_name.toLowerCase().includes(query.toLowerCase()) ||
        company.name?.toLowerCase().includes(query.toLowerCase())
      )

      searchResults.customers = [
        {
          id: 1,
          name: 'ABC Industries Pvt Ltd',
          comp_name: 'ABC Manufacturing Ltd',
          email: 'purchase@abcindustries.com'
        }
      ].filter((customer: any) =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.comp_name?.toLowerCase().includes(query.toLowerCase())
      )

      localStorage.setItem('searchResults', JSON.stringify(searchResults))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }

  // Handle blur with delay to allow click events to register
  const handleBlur = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearchFocused(false)
    }, 200) // 200ms delay to allow click to register
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  // Helper function to format the current route for breadcrumbs
  const getPageTitle = () => {
    const path = location.pathname.substring(1) // remove leading slash
    if (!path || path === 'dashboard') return 'Overview / Dashboard'

    // Split by slash for nested routes
    const segments = path.split('/')

    if (segments[0] === 'companies') {
      if (segments.length > 1) return 'Companies / Details'
      return 'Entities / Companies'
    }
    if (segments[0] === 'admins') return 'Entities / Company Admins'
    if (segments[0] === 'customers') return 'Entities / Customers'
    if (segments[0] === 'parts') return 'Inventory / Parts'
    if (segments[0] === 'orders') return 'Sales / Orders'
    if (segments[0] === 'delivery-challans') return 'Delivery / Challans'
    if (segments[0] === 'reports') return 'Overview / Reports'
    if (segments[0] === 'settings') return 'System / Settings'

    // Default capitalization
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ')
  }

  return (
    <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 w-full lg:ml-64 lg:w-[calc(100%-16rem)] transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center text-sm">
              <span className="font-semibold text-gray-800 tracking-wide text-base">
                {getPageTitle().split(' / ')[0]}
              </span>
              {getPageTitle().includes(' / ') && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  <span className="font-medium text-gray-500">
                    {getPageTitle().split(' / ')[1]}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Enhanced Global Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 transition-colors duration-200 ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <input
                id="global-search"
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={handleBlur}
                className={`block w-48 lg:w-72 pl-10 pr-12 py-2 border rounded-full leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white transition-all duration-300 sm:text-sm ${isSearchFocused
                    ? 'border-blue-400 ring-4 ring-blue-500/20 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              />
              {!searchQuery && !isSearchFocused && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <kbd className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 border border-gray-200 rounded text-xs font-sans text-gray-400 bg-white shadow-sm">
                    <Command className="h-3 w-3" />
                    <span>K</span>
                  </kbd>
                </div>
              )}
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <span className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-full hover:bg-gray-100 transition-colors">×</span>
                </button>
              )}

              {/* Search suggestions dropdown - Glassmorphism style */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto ring-1 ring-black/5">
                  <div className="p-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Search Results</div>

                    {/* Display search results from localStorage */}
                    {(() => {
                      const storedResults = localStorage.getItem('searchResults')
                      if (storedResults) {
                        const results = JSON.parse(storedResults)
                        const hasResults = results.companies.length > 0 || results.customers.length > 0 || results.orders.length > 0 || results.deliveryChallans.length > 0

                        if (hasResults) {
                          return (
                            <div className="space-y-4">
                              {results.companies.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-gray-500 mb-1 px-2 flex items-center">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                                    Companies
                                  </div>
                                  <div className="space-y-1">
                                    {results.companies.slice(0, 3).map((company: any, index: number) => (
                                      <div
                                        key={index}
                                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm rounded-lg transition-colors group flex justify-between items-center"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          navigate(`/companies/${company.id}`);
                                          setIsSearchFocused(false);
                                          setSearchQuery('');
                                        }}
                                      >
                                        <div>
                                          <div className="font-medium text-gray-900 group-hover:text-blue-900">{company.comp_name}</div>
                                          <div className="text-gray-500 text-xs">{company.email}</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {results.customers.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-gray-500 mb-1 px-2 flex items-center">
                                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2"></span>
                                    Customers
                                  </div>
                                  <div className="space-y-1">
                                    {results.customers.slice(0, 3).map((customer: any, index: number) => (
                                      <div key={index} className="p-2 hover:bg-purple-50 cursor-pointer text-sm rounded-lg transition-colors group flex justify-between items-center" onMouseDown={(e) => { e.preventDefault(); navigate('/customers'); setIsSearchFocused(false); setSearchQuery(''); }}>
                                        <div>
                                          <div className="font-medium text-gray-900 group-hover:text-purple-900">{customer.name}</div>
                                          <div className="text-gray-500 text-xs">{customer.comp_name}</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        } else {
                          return (
                            <div className="text-sm text-gray-500 px-2 py-4 flex flex-col items-center justify-center text-center">
                              <Search className="h-8 w-8 text-gray-200 mb-2" />
                              <p>No results found for "<span className="font-medium text-gray-800">{searchQuery}</span>"</p>
                            </div>
                          )
                        }
                      } else {
                        return (
                          <div className="text-sm text-gray-500 px-2 flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            Searching...
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications with Live Badge */}
            <div className="relative">
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
                {/* Notification Badge indicator */}
                <span className="absolute top-1 right-1 block w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
              </button>
            </div>

            {/* Redundant user profile removed as it's now beautifully handled in the bottom of the sidebar */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Topbar