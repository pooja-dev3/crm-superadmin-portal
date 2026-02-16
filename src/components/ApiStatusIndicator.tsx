import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { apiUtils } from '../services/apiUtils'

const ApiStatusIndicator: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [apiInfo, setApiInfo] = useState<any>(null)

  useEffect(() => {
    const checkApi = async () => {
      setApiStatus('checking')
      const info = apiUtils.getApiInfo()
      setApiInfo(info)
      
      if (info.useMockApi) {
        setApiStatus('disconnected')
        return
      }

      const isConnected = await apiUtils.checkApiConnection()
      setApiStatus(isConnected ? 'connected' : 'disconnected')
    }

    checkApi()
  }, [])

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'checking':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusText = () => {
    switch (apiStatus) {
      case 'checking':
        return 'Checking API...'
      case 'connected':
        return 'API Connected'
      case 'disconnected':
        return apiInfo?.useMockApi ? 'Using Mock API' : 'API Disconnected'
    }
  }

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'checking':
        return 'bg-blue-100 text-blue-800'
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
        return apiInfo?.useMockApi ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="ml-2">{getStatusText()}</span>
    </div>
  )
}

export default ApiStatusIndicator
