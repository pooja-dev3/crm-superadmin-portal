import { apiClient } from './api'

export const apiUtils = {
  // Check if API server is running
  checkApiConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.22:8000/api'}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok
    } catch (error) {
      console.warn('API server not reachable:', error)
      return false
    }
  },

  // Test specific endpoint
  testEndpoint: async (endpoint: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await apiClient.get(endpoint)
      return { success: true, data: response }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  // Get API configuration info
  getApiInfo: () => ({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.22:8000/api',
    useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
    isProduction: import.meta.env.MODE === 'production'
  })
}
