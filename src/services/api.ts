// API Configuration and Base Client
import { API_CONFIG } from '../config/api'

const API_BASE_URL = API_CONFIG.BASE_URL
const MOCK_MODE = false // Disabled - using real API

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Mock mode for development without backend
    if (MOCK_MODE) {
      return this.mockResponse<T>(endpoint, options)
    }

    const url = `${this.baseURL}${endpoint}`
    
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        let errorData: any
        const responseText = await response.text()
        
        try {
          errorData = JSON.parse(responseText)
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e)
          errorData = { rawResponse: responseText }
        }
        
        console.error('API Error Response:', errorData)
        console.error('Status:', response.status)
        console.error('Status Text:', response.statusText)
        
        // Handle HTML error pages
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server returned HTML error page instead of JSON. Status: ${response.status}. Raw response: ${responseText.substring(0, 200)}...`)
        }
        
        // Handle 401 Unauthorized - remove invalid token
        if (response.status === 401) {
          localStorage.removeItem('auth_token')
        }
        
        // Create a more detailed error message
        let errorMessage = `HTTP error! status: ${response.status}`
        
        if (response.status >= 500) {
          if (errorData.error) {
            errorMessage = `Server error: ${errorData.error}`
          } else {
            errorMessage = 'Internal server error. Please check server logs.'
          }
        } else if (response.status === 422) {
          // Laravel validation errors
          if (errorData.errors) {
            const validationErrors = Object.values(errorData.errors).flat().join(', ')
            errorMessage = `Validation errors: ${validationErrors}`
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
        
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log('API Success Response:', responseData)
      return responseData
    } catch (error) {
      console.error('API Request Failed:', error)
      
      if (error instanceof Error) {
        // Check if it's a network error
        if (error.message.includes('Failed to fetch')) {
          if (endpoint.includes('192.168.1.22')) {
            throw new Error('Unable to connect to API server. Please ensure the backend server is running on http://192.168.1.22:8000')
          } else {
            throw new Error('Network error: Unable to reach the API server')
          }
        }
      }
      
      throw error
    }
  }

  private mockResponse<T>(endpoint: string, options: RequestInit): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (endpoint === '/auth/login' && options.method === 'POST') {
          const mockLoginResponse = {
            success: true,
            message: 'Login successful',
            token: 'mock-jwt-token-12345',
            user: {
              id: 1,
              name: 'Super Admin',
              email: 'superadmin@example.com',
              role: 'superadmin'
            }
          }
          resolve(mockLoginResponse as T)
        } else if (endpoint === '/auth/me') {
          const mockUserResponse = {
            success: true,
            data: {
              id: 1,
              name: 'Super Admin',
              email: 'superadmin@example.com',
              role: 'admin'
            }
          }
          resolve(mockUserResponse as T)
        } else if (endpoint === '/auth/logout') {
          const mockLogoutResponse = {
            success: true,
            message: 'Logout successful'
          }
          resolve(mockLogoutResponse as T)
        } else {
          // Generic mock response for other endpoints
          resolve({ success: true, data: [] } as T)
        }
      }, 500) // Simulate network delay
    })
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    console.log('API POST Request:', endpoint, data)
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
