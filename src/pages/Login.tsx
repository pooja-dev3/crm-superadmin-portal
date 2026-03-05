import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Shield, Lock, Mail, ChevronRight, CheckCircle2 } from 'lucide-react'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    } else if (email.length > 254) {
      errors.email = 'Email address is too long'
    }

    // Password validation
    if (!password.trim()) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value)
    } else {
      setPassword(value)
    }

    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }

    if (error) {
      setError('')
    }
  }

  const handleFillDemo = () => {
    setEmail('superadmin@example.com')
    setPassword('superadmin123')
    setFieldErrors({})
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const success = await login(email, password)

      if (success) {
        navigate(from, { replace: true })
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white animate-fade-in-scale">
      {/* Left Full-Height Banner - Brand Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative flex-col justify-between overflow-hidden">
        {/* Subtle patterned background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 right-12 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transform translate-y-1/2"></div>
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

        <div className="relative z-10 p-12 flex flex-col h-full">
          <div>
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 mb-8 shadow-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Enterprise CRM<br />
              <span className="text-blue-300">Command Center</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed font-medium">
              Seamlessly manage companies, process orders, and orchestrate deliveries from one powerful, unified dashboard.
            </p>
          </div>

          <div className="mt-auto">
            <div className="space-y-4 border-l-2 border-white/20 pl-6 text-white">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-blue-300 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">Advanced reporting and real-time operational analytics.</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-blue-300 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">Secure, role-based access control for all organizations.</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-blue-300 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">Complete inventory and part lifecycle tracking.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:px-24 bg-white relative z-10 shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.1)]">

        {/* Mobile Logo (Visible only on small screens) */}
        <div className="lg:hidden flex justify-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-xl shadow-md">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Please enter your credentials to access the Super Admin portal.
            </p>
          </div>

          <div className="mt-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in-scale">
                <div className="flex">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-red-800">Authentication Failed</h3>
                    <div className="mt-1 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm ${fieldErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="admin@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium font-bold">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`appearance-none block w-full pl-10 pr-12 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm ${fieldErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 font-bold">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-bold text-blue-600 hover:text-blue-500 hover:underline transition-all">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign in securely
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Clean Demo Data Injector */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-center">
              <button
                onClick={handleFillDemo}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-xs font-semibold rounded-full text-gray-600 bg-white hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all group"
              >
                <Shield className="h-3.5 w-3.5 mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                Fill Demo Credentials
              </button>
            </div>

          </div>
        </div>

        {/* Simple crisp footer */}
        <div className="mt-auto pt-10 text-center lg:text-left">
          <p className="text-xs font-medium text-gray-400">
            © 2024 CRM. All rights reserved. Secure Gateway.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login