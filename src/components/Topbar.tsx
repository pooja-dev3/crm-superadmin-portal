import React, { useState, useEffect } from 'react'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Topbar: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    // If query is empty, don't perform search
    if (!query.trim()) {
      return
    }
    
    // Navigate to search results page or perform client-side search
    // For now, we'll implement a simple search across different entities
    console.log('Searching for:', query)
    
    // You can extend this to search across companies, customers, orders, etc.
    // For example, navigate to a search results page:
    // navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
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
                onBlur={() => setIsSearchFocused(false)}
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
              
              {/* Search suggestions dropdown (optional) */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="p-3 text-sm text-gray-500">
                    Press Enter to search for "{searchQuery}"
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