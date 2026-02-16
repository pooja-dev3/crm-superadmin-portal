import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, tokenManager } from '../services/auth'
import type { User } from '../types/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token and user data
    const token = tokenManager.getToken()
    const storedUser = localStorage.getItem('auth_user')
    
    if (token && storedUser) {
      console.log('Found token and user data, validating...')
      
      try {
        // Parse stored user data
        const userData = JSON.parse(storedUser)
        
        // More lenient token validation - just check if it's a non-empty string
        if (token && token.length > 10) {
          // Try to check if it's a JWT token
          try {
            const tokenParts = token.split('.')
            if (tokenParts.length === 3) {
              // It's a JWT token, try to decode payload
              const payload = JSON.parse(atob(tokenParts[1]))
              const currentTime = Date.now() / 1000
              
              if (payload.exp && payload.exp > currentTime) {
                // Token is valid and not expired
                console.log('JWT token is valid and not expired')
                setUser(userData)
              } else if (payload.exp && payload.exp <= currentTime) {
                // Token is expired
                console.log('JWT token is expired, logging out')
                tokenManager.removeToken()
                localStorage.removeItem('auth_user')
                setUser(null)
              } else {
                // No expiration claim, assume it's valid
                console.log('JWT token has no expiration, assuming valid')
                setUser(userData)
              }
            } else {
              // Not a JWT token, but still a valid token format
              console.log('Token is not JWT format, but appears valid')
              setUser(userData)
            }
          } catch (error) {
            // Can't decode as JWT, but it might still be a valid token
            console.log('Token is not decodable as JWT, but keeping it as valid')
            setUser(userData)
          }
        } else {
          // Token is too short or empty
          console.log('Token is too short or empty, logging out')
          tokenManager.removeToken()
          localStorage.removeItem('auth_user')
          setUser(null)
        }
      } catch (error) {
        console.log('Failed to parse stored user data, logging out')
        tokenManager.removeToken()
        localStorage.removeItem('auth_user')
        setUser(null)
      }
    } else if (token && !storedUser) {
      // Token exists but no user data - keep token but set user to null for now
      // API calls will validate and set user
      console.log('Token exists but no user data, keeping token')
      setUser(null)
    } else {
      // No token, user is not authenticated
      console.log('No token found, user not authenticated')
      setUser(null)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await authApi.login(email, password)
      
      console.log('Login response:', response)
      
      if (response.success && response.token && response.user) {
        // Extract user and token directly from response (real API structure)
        const { token, user } = response
        tokenManager.setToken(token)
        localStorage.setItem('auth_user', JSON.stringify(user))
        setUser(user)
        setIsLoading(false)
        return true
      } else {
        console.error('Login failed - response structure:', response)
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      tokenManager.removeToken()
      localStorage.removeItem('auth_user')
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}