import React, { useState, useEffect, useRef } from 'react'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../services/api'

const Topbar: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
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
      console.log('API Connectivity Test - Status:', response.status)
      console.log('API Connectivity Test - OK:', response.ok)
      console.log('API Connectivity Test - Headers:', response.headers)
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

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-[100] w-full lg:ml-64 lg:w-[calc(100%-16rem)]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              CRM Super Admin Panel
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search companies, customers, orders..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={handleBlur}
                className="block w-48 lg:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <span className="text-gray-400 hover:text-gray-600 text-sm">×</span>
                </button>
              )}
              
              {/* Search suggestions dropdown */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 w-96 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Search Results</div>
                    
                    {/* Loading indicator */}
                    <div className="text-sm text-gray-600">Searching...</div>
                    
                    {/* Display search results from localStorage */}
                    {(() => {
                      const storedResults = localStorage.getItem('searchResults')
                      if (storedResults) {
                        const results = JSON.parse(storedResults)
                        const hasResults = results.companies.length > 0 || results.customers.length > 0 || results.orders.length > 0 || results.deliveryChallans.length > 0
                        
                        if (hasResults) {
                          return (
                            <>
                              {results.companies.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Companies</div>
                                  {results.companies.slice(0, 3).map((company: any, index: number) => (
                                    <div 
                                      key={index} 
                                      className="p-2 hover:bg-gray-50 cursor-pointer text-sm border border-transparent hover:border-blue-200 rounded" 
                                      style={{ cursor: 'pointer' }}
                                      onMouseDown={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        navigate(`/companies/${company.id}`); 
                                        setIsSearchFocused(false); 
                                        setSearchQuery(''); 
                                      }}
                                    >
                                      <div className="font-medium">{company.comp_name}</div>
                                      <div className="text-gray-500 text-xs">{company.email}</div>
                                    </div>
                                  ))}
                                  {results.companies.length > 3 && (
                                    <div className="text-xs text-blue-600 cursor-pointer hover:text-blue-800" onMouseDown={(e) => { e.preventDefault(); navigate('/companies'); setIsSearchFocused(false); }}>View all {results.companies.length} companies</div>
                                  )}
                                </div>
                              )}
                              
                              {results.customers.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Customers</div>
                                  {results.customers.slice(0, 3).map((customer: any, index: number) => (
                                    <div key={index} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border border-transparent hover:border-blue-200 rounded" onMouseDown={(e) => { e.preventDefault(); navigate('/customers'); setIsSearchFocused(false); setSearchQuery(''); }}>
                                      <div className="font-medium">{customer.name}</div>
                                      <div className="text-gray-500 text-xs">{customer.comp_name}</div>
                                      <div className="text-gray-400 text-xs">{customer.email}</div>
                                    </div>
                                  ))}
                                  {results.customers.length > 3 && (
                                    <div className="text-xs text-blue-600 cursor-pointer hover:text-blue-800" onMouseDown={(e) => { e.preventDefault(); navigate('/customers'); setIsSearchFocused(false); }}>View all {results.customers.length} customers</div>
                                  )}
                                </div>
                              )}
                              
                              {results.orders.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Orders</div>
                                  {results.orders.slice(0, 3).map((order: any, index: number) => (
                                    <div key={index} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border border-transparent hover:border-blue-200 rounded" onMouseDown={(e) => { e.preventDefault(); navigate('/orders'); setIsSearchFocused(false); setSearchQuery(''); }}>
                                      <div className="font-medium">Order #{order.id}</div>
                                      <div className="text-gray-500 text-xs">{order.status}</div>
                                    </div>
                                  ))}
                                  {results.orders.length > 3 && (
                                    <div className="text-xs text-blue-600 cursor-pointer hover:text-blue-800" onMouseDown={(e) => { e.preventDefault(); navigate('/orders'); setIsSearchFocused(false); }}>View all {results.orders.length} orders</div>
                                  )}
                                </div>
                              )}
                              
                              {results.deliveryChallans.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Delivery Challans</div>
                                  {results.deliveryChallans.slice(0, 3).map((challan: any, index: number) => (
                                    <div key={index} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border border-transparent hover:border-blue-200 rounded" onMouseDown={(e) => { e.preventDefault(); navigate('/delivery-challans'); setIsSearchFocused(false); setSearchQuery(''); }}>
                                      <div className="font-medium">{challan.challan_no || challan.challanNumber}</div>
                                      <div className="text-gray-500 text-xs">{challan.status}</div>
                                    </div>
                                  ))}
                                  {results.deliveryChallans.length > 3 && (
                                    <div className="text-xs text-blue-600 cursor-pointer hover:text-blue-800" onMouseDown={(e) => { e.preventDefault(); navigate('/delivery-challans'); setIsSearchFocused(false); }}>View all {results.deliveryChallans.length} challans</div>
                                  )}
                                </div>
                              )}
                            </>
                          )
                        } else {
                          return (
                            <div className="text-sm text-gray-600">No results found for "{searchQuery}"</div>
                          )
                        }
                      } else {
                        return null
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>

            {/* User menu */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500">Super Admin</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Topbar