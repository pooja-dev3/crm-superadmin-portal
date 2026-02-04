import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="py-8 pt-20 max-w-full overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 max-w-full">
            <div className="max-w-full overflow-hidden">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout