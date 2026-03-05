// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.MODE === 'development'
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://erp.rslsolution.org/public/api')
}
