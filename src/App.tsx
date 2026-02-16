import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import CompanyAdmins from './pages/CompanyAdmins'
import Customers from './pages/Customers'
import Parts from './pages/Parts'
import Orders from './pages/Orders'
import DeliveryChallans from './pages/DeliveryChallans'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import MainLayout from './components/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ToastContainer from './components/ToastContainer'
import './App.css'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
              <Route path="/login" element={<Login />} />

            {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="companies" element={<Companies />} />
                <Route path="companies/:id" element={<CompanyDetail />} />
                <Route path="admins" element={<CompanyAdmins />} />
                <Route path="customers" element={<Customers />} />
                <Route path="parts" element={<Parts />} />
                <Route path="orders" element={<Orders />} />
                <Route path="delivery-challans" element={<DeliveryChallans />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App